import { createUploadthing, type FileRouter } from 'uploadthing/next';

const f = createUploadthing();

export const uploadRouter = {
  // Audio file upload (tracks, podcasts)
  audioUpload: f({
    audio: { maxFileSize: '64MB', maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    console.log('[UploadThing] Audio uploaded:', file.ufsUrl);
    return { url: file.ufsUrl };
  }),

  // Image upload (covers, avatars, banners)
  imageUpload: f({
    image: { maxFileSize: '8MB', maxFileCount: 1 },
  }).onUploadComplete(({ file }) => {
    console.log('[UploadThing] Image uploaded:', file.ufsUrl);
    return { url: file.ufsUrl };
  }),

  // Multiple images (press photos, gallery)
  galleryUpload: f({
    image: { maxFileSize: '8MB', maxFileCount: 10 },
  }).onUploadComplete(({ file }) => {
    console.log('[UploadThing] Gallery image uploaded:', file.ufsUrl);
    return { url: file.ufsUrl };
  }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
