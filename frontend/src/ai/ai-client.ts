import { runHeritageChat } from './flows/chat';
import { analyzeImage } from './flows/analyze-image';
import { enhanceImageQuality } from './flows/enhance-image-quality';

export class ViraasatAIClient {
  static async chat(message: string, history: any[] = []) {
    return runHeritageChat({ message, history });
  }

  static async analyzeListingImage(imageDataUri: string) {
    return analyzeImage({ imageDataUri });
  }

  static async enhanceListingImage(imageUri: string) {
    return enhanceImageQuality({ imageUri });
  }
}
