import { analyzeImage } from '../flows/analyze-image';

export class ImageAnalyzer {
  static async inspectHandicraftImage(base64ImageUri: string) {
    return analyzeImage({ imageDataUri: base64ImageUri });
  }
}
