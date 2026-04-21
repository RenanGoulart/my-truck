import { useEffect, useState } from "react";
import * as Updates from "expo-updates";

const useUpdate = () => {
  const [isLoading, setIsLoadingUpdate] = useState(true);
  useEffect(() => {
    const update = async () => {
      try {
        if (!__DEV__) {
          const { isAvailable } = await Updates.checkForUpdateAsync();
          if (isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        }
      } catch {
        // segue o fluxo normal se a checagem de OTA falhar
      } finally {
        setIsLoadingUpdate(false);
      }
    };
    update();
  }, []);

  return isLoading;
};

export default useUpdate;
