import React, { useState } from 'react';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { S3_BUCKET_NAME, s3Client, rekognitionClient } from '../config/aws';
import { CompareFacesCommand } from '@aws-sdk/client-rekognition';
import { Camera, X, Download, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatedScene, AnimatedBox, FloatingElement } from './AnimatedElements';
import { colors, transforms, shadows } from '../config/theme';

const UploadSelfie = () => {
    const navigate = useNavigate();
    const [selfie, setSelfie] = useState<File | null>(null);
    const [matchedImages, setMatchedImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const validateImage = (file: File) => {
        // Check file type
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            throw new Error('Only JPEG and PNG images are supported');
        }

        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image size must be less than 5MB');
        }
        return true;
    };

    const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                validateImage(file);
                setSelfie(file);
                setPreviewUrl(URL.createObjectURL(file));
                setUploadError(null);
            } catch (error: any) {
                setUploadError(error.message);
            }
        }
    };

    const compareFaces = async (selfieUrl: string) => {
        try {
            const userEmail = localStorage.getItem('userEmail');
            const userName = localStorage.getItem('userName');
            const userRole = localStorage.getItem('userRole') || 'user';
            
            if (!userEmail && !userName) {
                throw new Error('User authentication required. Please log in to compare faces.');
            }
            
            const userIdentifier = userEmail || userName || '';
            const userFolder = userIdentifier.replace(/[^a-zA-Z0-9]/g, '_');
            
            const listCommand = new ListObjectsV2Command({
                Bucket: S3_BUCKET_NAME,
                Prefix: `${userRole}/${userFolder}/`,
            });
    
            const listResponse = await s3Client.send(listCommand);
            if (!listResponse.Contents || listResponse.Contents.length === 0) {
                console.log('No images found in user\'s uploads directory');
                return { matchedUrls: [], message: 'No images found in your uploads.' };
            }
    
            const uploadKeys = listResponse.Contents
                .map(item => item.Key)
                .filter(key => key && key !== `${userRole}/${userFolder}/` && !key.includes('/selfies/'));
            
            const matchedUrls: Array<{ url: string; similarity: number }> = [];
            let processedImages = 0;
            const totalImages = uploadKeys.length;
    
            for (const key of uploadKeys) {
                try {
                    processedImages++;
                    const compareCommand = new CompareFacesCommand({
                        SourceImage: {
                            S3Object: {
                                Bucket: S3_BUCKET_NAME,
                                Name: `${userRole}/${userFolder}/selfies/${selfieUrl}`,
                            },
                        },
                        TargetImage: {
                            S3Object: {
                                Bucket: S3_BUCKET_NAME,
                                Name: key,
                            },
                        },
                        SimilarityThreshold: 95, // Increased threshold for more accurate matches
                    });
    
                    const compareResponse = await rekognitionClient.send(compareCommand);
                    if (compareResponse.FaceMatches && compareResponse.FaceMatches.length > 0) {
                        // Sort face matches by similarity and take the highest match
                        const bestMatch = compareResponse.FaceMatches.reduce((prev, current) => {
                            return (prev.Similarity || 0) > (current.Similarity || 0) ? prev : current;
                        });
    
                        matchedUrls.push({
                            url: `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${key}`,
                            similarity: bestMatch.Similarity || 0
                        });
                        console.log(`Face match found in image: ${key} with similarity: ${bestMatch.Similarity}%`);
                    }
                } catch (error: any) {
                    if (error.name === 'InvalidParameterException') {
                        console.log(`No face detected in image: ${key}`);
                        continue;
                    }
                    console.error(`Error comparing with image ${key}:`, error);
                    continue;
                }
            }
    
            // Sort matches by similarity in descending order and filter high confidence matches only
            const sortedMatches = matchedUrls
                .sort((a, b) => b.similarity - a.similarity)
                .filter(match => match.similarity >= 95); // Only keep high confidence matches
            
            return {
                matchedUrls: sortedMatches.map(match => match.url),
                message: `Found ${sortedMatches.length} high-confidence matches out of ${totalImages} images processed.`
            };
        } catch (error) {
            console.error("Error in face comparison process:", error);
            throw new Error("Failed to process face comparison. Please try again.");
        }
    };

    const clearSelfie = () => {
        setSelfie(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
    };

    const uploadToS3 = async (file: File, fileName: string) => {
        try {
            console.log(`Uploading file: ${fileName}`);
    
            // Get user's email, name and role from localStorage
            const userEmail = localStorage.getItem('userEmail');
            const userName = localStorage.getItem('userName');
            const userRole = localStorage.getItem('userRole') || 'user';
            
            // Ensure we have a valid identifier for the user folder
            if (!userEmail && !userName) {
                throw new Error('User authentication required. Please log in to upload selfies.');
            }
            
            // Create a sanitized folder name from the email or username
            const userIdentifier = userEmail || userName || '';
            const userFolder = userIdentifier.replace(/[^a-zA-Z0-9]/g, '_');
    
            const uploadParams = {
                Bucket: S3_BUCKET_NAME,
                Key: `${userRole}/${userFolder}/selfies/${fileName}`,
                Body: file,
                ContentType: file.type,
            };
    
            const upload = new Upload({
                client: s3Client,
                params: uploadParams,
                partSize: 5 * 1024 * 1024, // 5MB part size for large files
                leavePartsOnError: false,
            });
    
            // Start the upload
            const data = await upload.done();
            console.log('Upload success:', data);
    
            return fileName; // Return only the filename for face comparison
        } catch (error) {
            console.error("Error uploading to S3:", error);
            throw error;
        }
    };



    const handleUpload = async () => {
        if (!selfie) {
            setUploadError("Please select a selfie to upload.");
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const fileName = `${Date.now()}-${selfie.name}`;
            await uploadToS3(selfie, fileName);
            try {
                const result = await compareFaces(fileName);
                setMatchedImages(result.matchedUrls);
                if (result.message) {
                    console.log(result.message);
                }
            } catch (error) {
                console.error('Error comparing faces:', error);
                setUploadError('Error comparing faces. Please try again.');
                return;
            }
        } catch (error) {
            console.error('Error uploading selfie:', error);
            setUploadError("Error uploading selfie. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-champagne to-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <Link to="/dashboard" className="text-turquoise hover:text-aquamarine transition-colors duration-300 flex items-center">
                            <ArrowLeft className="h-6 w-6 mr-2" />
                            Back to Dashboard
                        </Link>
                    </div>
                    
                    <div className="space-y-8">
                        {!selfie ? (
                            <div className="text-center">
                                <div className="mb-6">
                                    <Camera className="h-12 w-12 mx-auto text-turquoise animate-bounce" />
                                    <h2 className="mt-4 text-2xl font-bold text-turquoise">Upload Your Selfie</h2>
                                    <p className="mt-2 text-gray-600">Take or upload a selfie to find your photos</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleSelfieChange}
                                    className="hidden"
                                    id="selfie-upload"
                                />
                                <label
                                    htmlFor="selfie-upload"
                                    className="inline-block bg-gradient-to-r from-turquoise to-aquamarine text-white px-6 py-3 rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                >
                                    Choose Photo
                                </label>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="relative inline-block">
                                    <img
                                        src={previewUrl || ''}
                                        alt="Preview"
                                        className="w-64 h-64 object-cover rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105"
                                    />
                                    <button
                                        onClick={clearSelfie}
                                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-300"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {uploadError && (
                        <div className="text-red-500 text-sm text-center mt-4">{uploadError}</div>
                    )}

                    <div className="flex justify-center mt-6">
                        <button
                            onClick={handleUpload}
                            disabled={!selfie || isUploading}
                            className={`px-4 py-2 rounded-md text-white font-medium ${!selfie || isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-turquoise hover:bg-aquamarine hover:text-gray-800'} transition-colors duration-200`}
                        >
                            {isUploading ? 'Processing...' : 'Upload & Find Matches'}
                        </button>
                    </div>
                </div>
            </div>

            {matchedImages.length > 0 && (
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Matched Photos</h3>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Dashboard
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {matchedImages.map((url, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={url}
                                    alt={`Match ${index + 1}`}
                                    className="w-full h-48 object-cover rounded-lg shadow-md cursor-pointer"
                                    onClick={() => setSelectedImage(url)}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                    <button
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = url.split('/').pop() || 'image.jpg';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
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
            )}

            {selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
                    <div className="relative max-w-4xl w-full mx-4">
                        <img
                            src={selectedImage}
                            alt="Enlarged view"
                            className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement('a');
                                link.href = selectedImage;
                                link.download = selectedImage.split('/').pop() || 'image.jpg';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 shadow-lg"
                        >
                            <Download className="w-6 h-6 text-gray-900" />
                        </button>
                    </div>
                </div>
            )}

            {matchedImages.length === 0 && !isUploading && selfie && (
                <div className="text-center text-gray-500 mt-4">
                    No matching photos found.
                </div>
            )}
        </div>
    );
};

export default UploadSelfie;