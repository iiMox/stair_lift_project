import { useState } from "react";
import axios from "axios";

const baseURL = "http://192.168.244.133:8080";

interface MovementDetectorApi {
    requestStatus: () => Promise<boolean>;
    requestData: () => Promise<void>;
    status: boolean;
}

const useDetector = (): MovementDetectorApi => {
    const [status, setStatus] = useState<boolean>(false);

    const requestStatus = async () => {
        try {
            const { data } = await axios.get(`${baseURL}/status`);

            if (data) {
                return data.serverStatus;
            }
        } catch (err) {
            console.log(err);
        }

        return false;
    };

    const requestData = async () => {
        try {
            const { data } = await axios.get(`${baseURL}/state`);

            if (data) {
                return data;
            }
        } catch (err) {
            console.log(err);
        }
        return { tool: "", direction: "" /* , floors: 0 */ };
    };

    return {
        status,
        requestStatus,
        requestData,
    };
};

export default useDetector;
