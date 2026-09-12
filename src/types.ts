export type AspectRatioPreset = '16:9' | '4:3' | '3:2' | '21:9' | 'custom';

export type ConversionMode = 'change_orientation' | 'crop_fill' | 'smart_crop' | 'blur_fill';

export type RotationAngle = 90 | 270 | 180;

export interface OrientationOptions {
  rotation: RotationAngle; // 90 = 90° Clockwise (Landscape), 270 = 90° CCW (Landscape), 180 = 180° Inverted
  flipHorizontal: boolean;
  flipVertical: boolean;
  fitMode: 'fit' | 'fill';
}

export type ResolutionTarget = '720p' | '1080p' | '1440p' | '4k' | 'source';

export interface BlurFillOptions {
  blurStrength: number; // 5 to 60 (default 30)
  bgBrightness: number; // -0.5 to 0.1 (default -0.2)
  bgZoom: number; // 1.0 to 1.8 (default 1.15)
}

export interface CropFillOptions {
  xPosition: number; // -100 to 100 (default 0)
  yPosition: number; // -100 to 100 (default 0)
  zoom: number; // 1.0 to 2.5 (default 1.0)
}

export interface CustomRatio {
  width: number;
  height: number;
}

export interface ConversionConfig {
  aspectRatio: AspectRatioPreset;
  customRatio?: CustomRatio;
  mode: ConversionMode;
  resolution: ResolutionTarget;
  orientationOptions: OrientationOptions;
  blurOptions: BlurFillOptions;
  cropOptions: CropFillOptions;
}

export interface VideoMetadata {
  width: number;
  height: number;
  duration: number;
  fps: number;
  codec: string;
  bitrate?: number;
  sizeBytes?: number;
  hasAudio: boolean;
  aspectRatioLabel: string;
}

export interface FacebookVideoInfo {
  sourceType: 'facebook' | 'upload' | 'sample';
  originalUrl?: string;
  title: string;
  author?: string;
  thumbnailUrl?: string;
  streamUrl: string;
  tempFilePath?: string;
  fileId: string;
  metadata: VideoMetadata;
}

export type JobStage = 'checking' | 'preparing' | 'processing' | 'finalizing' | 'ready' | 'failed';

export interface ConversionJob {
  id: string;
  stage: JobStage;
  progress: number;
  message: string;
  error?: string;
  inputInfo: FacebookVideoInfo;
  config: ConversionConfig;
  outputFilePath?: string;
  outputMeta?: VideoMetadata;
  downloadUrl?: string;
  createdAt: number;
  completedAt?: number;
}
