declare module 'react-native' {
  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
  };
  export const View: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const Image: React.ComponentType<any>;
  export const TouchableOpacity: React.ComponentType<any>;
  export const TextInput: React.ComponentType<any>;
  export const SafeAreaView: React.ComponentType<any>;
  export const StatusBar: React.ComponentType<any>;
  export const Modal: React.ComponentType<any>;
  export const ActivityIndicator: React.ComponentType<any>;
  export const Alert: {
    alert: (title: string, message?: string, buttons?: any[], options?: any) => void;
  };
  export const Share: {
    share: (content: { message: string; title?: string; url?: string }) => Promise<any>;
  };
  export const Dimensions: {
    get: (dim: 'window' | 'screen') => { width: number; height: number; scale: number; fontScale: number };
  };
}

declare function require(moduleName: string): any;
