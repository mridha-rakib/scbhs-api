import { env } from "@/env";
import { S3Client } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

// const bucket = env.AWS_PROFILE_IMAGES_BUCKET || "";

// class FileUploadUtils {
//   uploadToS3 = async (
//     fileContent: Buffer,
//     key: string,
//     contentType: string
//   ) => {
//     await s3.send(
//       new PutObjectCommand({
//         Bucket: bucket,
//         Key: key,
//         Body: fileContent,
//         ContentType: contentType,
//         ACL: "public-read",
//       })
//     );

//     return `https://${bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
//   };
// }
// const fileUploadUtils = new FileUploadUtils();
// export default fileUploadUtils;
