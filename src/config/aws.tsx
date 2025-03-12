import { S3Client } from '@aws-sdk/client-s3';
import { RekognitionClient } from '@aws-sdk/client-rekognition';

const region = import.meta.env.VITE_AWS_REGION;
const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
const bucketName = import.meta.env.VITE_S3_BUCKET_NAME;

// Always use real clients
export const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
    },
});

export const rekognitionClient = new RekognitionClient({
    region,
    credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
    },
});

export const S3_BUCKET_NAME = bucketName || 'ps-pics';