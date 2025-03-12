import React, { useState, useEffect } from 'react';
import { AnimatedScene, AnimatedText, AnimatedBox, FloatingElement } from './AnimatedElements';
import { colors } from '../config/theme';
import { useParams } from 'react-router-dom';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { S3_BUCKET_NAME, s3Client, rekognitionClient } from '../config/aws';
import { DetectFacesCommand, CompareFacesCommand } from '@aws-sdk/client-rekognition';
import { Download, Upload as UploadIcon } from 'lucide-react';
import QRCode from 'qrcode';

interface EventImage {
  url: string;
  faces: Array<{
    boundingBox: any;
    confidence: number;
  }>;
}

interface FaceGroup {
  faceId: string;
  images: EventImage[];
}

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<any>(null);
  const [images, setImages] = useState<EventImage[]>([]);
  const [faceGroups, setFaceGroups] = useState<FaceGroup[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      const savedEvents = localStorage.getItem('events');
      if (savedEvents) {
        const events = JSON.parse(savedEvents);
        const currentEvent = events.find((e: any) => e.id === eventId);
        if (currentEvent) {
          setEvent(currentEvent);
          await loadEventImages();
          generateQRCode();
        }
      }
    } catch (error) {
      console.error('Error loading event details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEventImages = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName');
      const userRole = localStorage.getItem('userRole') || 'user';
      
      if (!userEmail && !userName) return;
      
      const userIdentifier = userEmail || userName || '';
      const userFolder = userIdentifier.replace(/[^a-zA-Z0-9]/g, '_');
      
      const listCommand = new ListObjectsV2Command({
        Bucket: S3_BUCKET_NAME,
        Prefix: `${userRole}/${userFolder}/${eventId}/`,
      });

      const response = await s3Client.send(listCommand);
      if (!response.Contents) return;

      const imageUrls = response.Contents
        .filter(item => item.Key && !item.Key.endsWith('/'))
        .map(item => `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${item.Key}`);

      const eventImages: EventImage[] = [];

      for (const url of imageUrls) {
        const faces = await detectFaces(url);
        eventImages.push({ url, faces });
      }

      setImages(eventImages);
      await organizeFaceGroups(eventImages);
    } catch (error) {
      console.error('Error loading event images:', error);
    }
  };

  const detectFaces = async (imageUrl: string) => {
    try {
      const key = imageUrl.split('.com/')[1];
      const detectFacesCommand = new DetectFacesCommand({
        Image: {
          S3Object: {
            Bucket: S3_BUCKET_NAME,
            Name: key,
          },
        },
        Attributes: ['DEFAULT'],
      });

      const response = await rekognitionClient.send(detectFacesCommand);
      return response.FaceDetails || [];
    } catch (error) {
      console.error('Error detecting faces:', error);
      return [];
    }
  };

  const organizeFaceGroups = async (eventImages: EventImage[]) => {
    try {
      const groups: FaceGroup[] = [];
      const processedImages: Set<string> = new Set();

      for (const image of eventImages) {
        if (processedImages.has(image.url) || image.faces.length === 0) continue;

        const group: FaceGroup = {
          faceId: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          images: [image]
        };

        for (const otherImage of eventImages) {
          if (processedImages.has(otherImage.url) || otherImage.url === image.url) continue;

          try {
            const key1 = image.url.split('.com/')[1];
            const key2 = otherImage.url.split('.com/')[1];

            if (!key1.match(/\.(jpg|jpeg|png)$/i) || !key2.match(/\.(jpg|jpeg|png)$/i)) {
              console.log('Skipping unsupported image format');
              continue;
            }

            const compareCommand = new CompareFacesCommand({
              SourceImage: {
                S3Object: {
                  Bucket: S3_BUCKET_NAME,
                  Name: key1
                }
              },
              TargetImage: {
                S3Object: {
                  Bucket: S3_BUCKET_NAME,
                  Name: key2
                }
              },
              SimilarityThreshold: 90
            });

            const compareResponse = await rekognitionClient.send(compareCommand);
            if (compareResponse.FaceMatches && compareResponse.FaceMatches.length > 0) {
              group.images.push(otherImage);
              processedImages.add(otherImage.url);
            }
          } catch (error: any) {
            if (error.name === 'InvalidImageFormatException') {
              console.log(`Skipping image due to invalid format: ${otherImage.url}`);
              continue;
            }
            console.error('Error comparing faces:', error);
          }
        }

        processedImages.add(image.url);
        if (group.images.length > 0) {
          groups.push(group);
        }
      }

      setFaceGroups(groups);
    } catch (error) {
      console.error('Error organizing face groups:', error);
    }
  };

  const generateQRCode = async () => {
    try {
      const eventUrl = window.location.href;
      const qrCode = await QRCode.toDataURL(eventUrl);
      setQrCodeUrl(qrCode);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `event-${eventId}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = url.split('/').pop() || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not a valid image file`);
          return false;
        }
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name} exceeds the 10MB size limit`);
          return false;
        }
        return true;
      });
      setSelectedImages(validFiles);
    }
  };

  const uploadToS3 = async (file: File, fileName: string) => {
    try {
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName');
      const userRole = localStorage.getItem('userRole') || 'user';
      
      if (!userEmail && !userName) {
        throw new Error('User authentication required. Please log in to upload images.');
      }
      
      const userIdentifier = userEmail || userName || '';
      const userFolder = userIdentifier.replace(/[^a-zA-Z0-9]/g, '_');
      
      const uploadParams = {
        Bucket: S3_BUCKET_NAME,
        Key: `${userRole}/${userFolder}/${eventId}/${fileName}`,
        Body: file,
        ContentType: file.type,
      };
      
      const upload = new Upload({
        client: s3Client,
        params: uploadParams,
        partSize: 5 * 1024 * 1024,
        leavePartsOnError: false,
      });
      
      const data = await upload.done();
      console.log('Upload success:', data);
      
      return `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${userRole}/${userFolder}/${eventId}/${fileName}`;
    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) {
      alert('Please select at least one image to upload.');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const uploadPromises = selectedImages.map(async (image) => {
        if (!image.type.startsWith('image/')) {
          throw new Error(`${image.name} is not a valid image file`);
        }
        if (image.size > 10 * 1024 * 1024) {
          throw new Error(`${image.name} exceeds the 10MB size limit`);
        }
        const fileName = `${Date.now()}-${image.name}`;
        const imageUrl = await uploadToS3(image, fileName);
        return { url: imageUrl, faces: [] };
      });

      const newImages = await Promise.all(uploadPromises);
      setImages(prevImages => [...prevImages, ...newImages]);

      // Update event with new images
      const updatedEvent = {
        ...event,
        images: [...(event.images || []), ...newImages.map(img => img.url)]
      };
      setEvent(updatedEvent);

      // Save event with updated images
      await handleSaveEvent();

      setUploadSuccess(true);
      setSelectedImages([]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEvent = async () => {
    if (!event) return;
    
    try {
      const userEmail = localStorage.getItem('userEmail');
      const userName = localStorage.getItem('userName');
      const userRole = localStorage.getItem('userRole') || 'user';
      
      if (!userEmail && !userName) {
        throw new Error('User authentication required');
      }
      
      const userIdentifier = userEmail || userName || '';
      const userFolder = userIdentifier.replace(/[^a-zA-Z0-9]/g, '_');
      
      // Move images to event folder if they're not already there
      const updatedImages = await Promise.all(images.map(async (image) => {
        const currentKey = image.url.split('.com/')[1];
        const isInEventFolder = currentKey.includes(`/${eventId}/`);
        
        if (!isInEventFolder) {
          const fileName = currentKey.split('/').pop();
          const newKey = `${userRole}/${userFolder}/${eventId}/${fileName}`;
          
          await s3Client.send(new CopyObjectCommand({
            Bucket: S3_BUCKET_NAME,
            CopySource: `${S3_BUCKET_NAME}/${currentKey}`,
            Key: newKey
          }));
          
          await s3Client.send(new DeleteObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: currentKey
          }));
          
          return { ...image, url: `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${newKey}` };
        }
        return image;
      }));
      
      setImages(updatedImages);
      
      const savedEvents = localStorage.getItem('events') || '[]';
      const events = JSON.parse(savedEvents);
      const existingEventIndex = events.findIndex((e: any) => e.id === eventId);
      
      const updatedEvent = {
        ...event,
        images: updatedImages.map(img => img.url),
        lastModified: new Date().toISOString()
      };
      
      if (existingEventIndex >= 0) {
        events[existingEventIndex] = updatedEvent;
      } else {
        events.push(updatedEvent);
      }
      
      localStorage.setItem('events', JSON.stringify(events));
      alert('Event saved successfully!');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 bg-champagne min-h-screen transition-all duration-300 ease-in-out">
      <AnimatedScene height="300px">
        <AnimatedText 
          text={event?.name || 'Event Details'}
          position={[-2, 1, 0]}
          size={0.5}
          color={colors.turquoise}
        />
        <AnimatedBox 
          position={[2, -1, 0]} 
          color={colors.aquamarine}
          rotation={[0.5, 0.5, 0]}
        />
      </AnimatedScene>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-turquoise"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-2 border-aquamarine">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event?.name}</h1>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center">
                <span className="text-gray-600">{new Date(event?.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600">{event?.location}</span>
              </div>
              <button
                onClick={handleSaveEvent}
                className="ml-auto px-4 py-2 bg-turquoise text-white rounded-lg hover:bg-aquamarine hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-turquoise transition-colors duration-200"
              >
                Save Event
              </button>
            </div>

            {/* Upload Section */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
                <div className="flex items-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-aquamarine rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-aquamarine hover:text-white transition-colors duration-200"
                  >
                    <UploadIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Select Images
                  </label>
                </div>
                {selectedImages.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">{selectedImages.length} images selected</p>
                )}
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleUpload}
                  disabled={isUploading || selectedImages.length === 0}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-turquoise hover:bg-aquamarine hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-turquoise transition-colors duration-200 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Face Groups Section */}
      {faceGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">People in Event</h2>
          <div className="flex overflow-x-auto space-x-4 pb-4 px-4 py-2 bg-white rounded-lg border-2 border-aquamarine">
            {faceGroups.map((group) => (
              <div key={group.faceId} className="flex-shrink-0">
                <img
                  src={group.images[0].url}
                  alt="Face thumbnail"
                  className="w-24 h-24 object-cover rounded-lg shadow-md"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Code Section */}
      {qrCodeUrl && (
        <div className="mb-8 p-4 bg-white rounded-lg shadow-md border-2 border-aquamarine">
          <h2 className="text-xl font-semibold mb-4">Event QR Code</h2>
          <div className="flex items-center space-x-4">
            <img src={qrCodeUrl} alt="Event QR Code" className="w-32 h-32" />
            <button
              onClick={downloadQRCode}
              className="flex items-center px-4 py-2 bg-turquoise text-white rounded-lg hover:bg-aquamarine hover:text-gray-800 transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </button>
          </div>
        </div>
      )}

      {/* Images Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image.url}
              alt={`Event image ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg shadow-md"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-4">
              <button
                onClick={() => downloadImage(image.url)}
                className="p-2 bg-white rounded-full hover:bg-gray-100"
                title="Download"
              >
                <Download className="w-5 h-5 text-gray-900" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
)};

export default EventDetails;