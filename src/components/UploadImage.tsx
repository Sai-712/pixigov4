import React, { useState } from 'react';
import { Upload } from '@aws-sdk/lib-storage';
import { S3_BUCKET_NAME, s3Client } from '../config/aws';
import { Upload as UploadIcon, X } from 'lucide-react';
import { AnimatedScene, AnimatedBox, FloatingElement } from './AnimatedElements';
import { colors, transforms, shadows } from '../config/theme';

const UploadImage = () => {
    const [images, setImages] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files));
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
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
                throw new Error('User authentication required. Please log in to upload images.');
            }
            
            // Create a sanitized folder name from the email or username
            const userIdentifier = userEmail || userName || '';
            const userFolder = userIdentifier.replace(/[^a-zA-Z0-9]/g, '_');
    
            const uploadParams = {
                Bucket: S3_BUCKET_NAME,
                Key: `${userRole}/${userFolder}/${fileName}`,
                Body: file,
                ContentType: file.type,
            };
    
            const upload = new Upload({
                client: s3Client,
                params: uploadParams,
                partSize: 5 * 1024 * 1024,
                leavePartsOnError: false,
            });
    
            // Start the upload
            const data = await upload.done();
            console.log('Upload success:', data);
    
            return `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${userRole}/${userFolder}/${fileName}`;
        } catch (error) {
            console.error("Error uploading to S3:", error);
            throw error;
        }
    };

    const handleUpload = async () => {
        if (images.length === 0) {
            alert("Please select at least one image to upload.");
            return;
        }

        setIsUploading(true);
        setUploadSuccess(false);

        try {
            const uploadPromises = images.map(async (image) => {
                if (!image.type.startsWith('image/')) {
                    throw new Error(`${image.name} is not a valid image file`);
                }
                if (image.size > 10 * 1024 * 1024) {
                    throw new Error(`${image.name} exceeds the 10MB size limit`);
                }
                const fileName = `${Date.now()}-${image.name}`;
                const imageUrl = await uploadToS3(image, fileName);
                return imageUrl;
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            console.log('Uploaded images:', uploadedUrls);

            // Generate QR code with the current domain for selfie upload
            const currentDomain = window.location.origin;
            setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentDomain}/upload_selfie`);
            setUploadSuccess(true);
        } catch (error) {
            console.error('Error uploading images:', error);
            alert(error instanceof Error ? error.message : "Failed to upload images. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen" style={{ background: colors.champagne }}>
            <AnimatedScene height="200px">
                <FloatingElement>
                    <AnimatedBox 
                        position={[-1, 0, 0]} 
                        color={colors.turquoise}
                        scale={0.8}
                        rotation={[0.5, 0.5, 0]}
                    />
                    <AnimatedBox 
                        position={[1, 0, 0]} 
                        color={colors.aquamarine}
                        scale={0.8}
                        rotation={[0.5, -0.5, 0]}
                    />
                </FloatingElement>
            </AnimatedScene>
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md border-2 border-aquamarine">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Images</h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="file-upload" className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg border-2 border-turquoise border-dashed cursor-pointer hover:border-aquamarine hover:bg-champagne transition-colors duration-200">
                            <div className="flex flex-col items-center">
                                <UploadIcon className="w-8 h-8 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-500">
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    PNG, JPG, GIF up to 10MB
                                </p>
                            </div>
                            <input
                                id="file-upload"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleImageChange}
                                accept="image/*"
                            />
                        </label>
                    </div>

                    {images.length > 0 && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">{images.length} file(s) selected</p>
                            <div className="flex flex-wrap gap-2">
                                {Array.from(images).map((image, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={URL.createObjectURL(image)}
                                            alt={`Preview ${index + 1}`}
                                            className="w-20 h-20 object-cover rounded"
                                        />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={isUploading || images.length === 0}
                        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-turquoise hover:bg-aquamarine hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-turquoise transition-colors duration-200 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isUploading ? 'Uploading...' : 'Upload Images'}
                    </button>
                </div>

                {uploadSuccess && (
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-center mb-4">
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                Upload successful!
                            </div>
                        </div>

                        <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Scan this QR Code to Upload a Selfie</h3>
                        <div className="flex flex-col items-center">
                            <img src={qrCodeUrl} alt="QR Code for Selfie Upload" className="w-48 h-48" />
                            <p className="mt-4 text-sm text-gray-600">
                                Or click{' '}
                                <a
                                    href="/upload_selfie"
                                    className="text-indigo-600 hover:text-indigo-500"
                                >
                                    here
                                </a>{' '}
                                to upload your selfie
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadImage;
