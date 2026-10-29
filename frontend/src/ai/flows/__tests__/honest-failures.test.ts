/** @jest-environment node */
jest.mock('@/ai/genkit',()=>({ai:{definePrompt:()=>jest.fn().mockResolvedValue({output:null}),defineFlow:(_schema:unknown,fn:unknown)=>fn,generate:jest.fn().mockResolvedValue({})}}));
import { analyzeImage } from '../analyze-image';
import { enhanceImageQuality } from '../enhance-image-quality';
import { translateText } from '../translate-text';
const image='data:image/png;base64,'+'a'.repeat(2000);
afterEach(()=>jest.restoreAllMocks());
test('image analysis without credentials never invents a classification',async()=>{
  const a=process.env.GEMINI_API_KEY,b=process.env.GOOGLE_API_KEY;
  delete process.env.GEMINI_API_KEY;delete process.env.GOOGLE_API_KEY;
  try {await expect(analyzeImage({imageDataUri:image})).rejects.toThrow('unavailable');}
  finally {if(a!==undefined)process.env.GEMINI_API_KEY=a;if(b!==undefined)process.env.GOOGLE_API_KEY=b;}
});
test('enhancement with no generated media does not report original as enhanced',async()=>{
  const previous=process.env.GEMINI_IMAGE_MODEL;process.env.GEMINI_IMAGE_MODEL='test-model';
  try {await expect(enhanceImageQuality({imageUri:image})).rejects.toThrow('unchanged');}
  finally {if(previous===undefined)delete process.env.GEMINI_IMAGE_MODEL;else process.env.GEMINI_IMAGE_MODEL=previous;}
});
test('failed translation does not substitute a canned heritage paragraph',async()=>{
  jest.spyOn(globalThis,'fetch').mockResolvedValue({ok:false} as Response);
  await expect(translateText({text:'Do not wash in hot water.',language:'Hindi'})).rejects.toThrow('original text');
});
