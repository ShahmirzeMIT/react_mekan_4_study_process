import axios from "axios";
import {toast} from "sonner";

const BASE_URL =  import.meta.env.VITE_API_BASE_URL;
const BASE_URL_LEARNER =  import.meta.env.VITE_API_BASE_URL_LEARNER;
const BASE_URL_COACH_CONSOLE = import.meta.env.VITE_API_COACH_CONSOLE;
const BASE_URL_CIRCLE = import.meta.env.VITE_API_CIRCLE;
const BASE_URL_STAFF = import.meta.env.VITE_API_BASE_URL_INTEGRATION_STAFF;
const DPMI = import.meta.env.VITE_DPMI_API;
export const callApi = async (url: string, params?: any) => {

    try {
        const response: any = await axios.post(BASE_URL + `/api${url}`, params);

        return response.data;
    } catch (error: any) {
        // if (error.response?.status === 403) {
        //     localStorage.removeItem("token");
        // }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};

export const callApiCoachConsole = async (url: string, params?: any) => {

    try {
        const response: any = await axios.post(BASE_URL_COACH_CONSOLE + `/api${url}`, params);

        return response.data;
    } catch (error: any) {
        if (error.response?.status === 403) {
            localStorage.removeItem("token");
        }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};


export const callApiWithTokenCoachConsole = async (url: string, params?: any) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            BASE_URL_COACH_CONSOLE + `/api${url}`,
            params,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;

    } catch (error: any) {
        console.log(error, 'error')
        if (error.status === 403) {
            // window.location.reload();
            window.location.href = '/login'
            localStorage.removeItem("token");
        }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};
// ✅ File upload with token
export const fileUploadCoachConsole = async (url: string, params?: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/api${url}`, params, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error(error, "error");
    if (error.response?.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    toast.error(error.response?.data?.error || "An error occurred");
    return error.response?.data || { error: "Unknown error" };
  }
};

export const callPSPApiIntegratrion = async (url: string, params?: any) => {


    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            `https://langdp-psp-coach.up.railway.app/api${url}`,
            params,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;

    } catch (error: any) {
        console.log(error, 'error')
        // if (error.status === 403) {
        //     // handleLogout(uid)
        //     window.location.reload();

        //     window.location.href='/login'
        //     localStorage.removeItem("token");
        // }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};

export const callApiWithTokeCircle = async (url: string, params?: any) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            BASE_URL_CIRCLE + `/api${url}`,
            params,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;

    } catch (error: any) {
        console.log(error, 'error')
        // if (error.status === 403) {
        //     // window.location.reload();
        //     window.location.href='/login'
        //     localStorage.removeItem("token");
        // }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};
// http://localhost:3000/api/enrollment/enrollment-read
export const callApiWithToken = async (url: string, params?: any) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            BASE_URL + `/api${url}`,
            params,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;

    } catch (error: any) {
        console.log(error, 'error')
        if (error.status === 403) {
            // window.location.reload();
            window.location.href = '/login'
            localStorage.removeItem("token");
        }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};
export const callApiWithTokenLearner = async (url: string, params?: any) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            BASE_URL_LEARNER + `/api${url}`,
            params,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;

    } catch (error: any) {
        console.log(error, 'error')
        if (error.status === 403) {
            // window.location.reload();
            window.location.href = '/login'
            localStorage.removeItem("token");
        }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};


export const callUploadApiWithFormData = async (url: string, formData: FormData) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            BASE_URL + `/api${url}`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    } catch (error: any) {
        console.log(error, 'upload error');
        toast.error(error.response?.data?.error || "Upload failed");
        return error.response?.data || {error: "Unknown error"};
    }
};


export const fileUpload = async (url: string, params?: any) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            BASE_URL + `/api${url}`,
            params,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;

    } catch (error: any) {
        console.log(error, 'error')
        // if (error.status === 403) {
        //     window.location.href='/login'
        //     localStorage.removeItem("token");
        // }

        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};


export const callApiWithGetToken = async (url: string, token: string, params?: any) => {
    try {
        const response = await axios.post(
            BASE_URL + `/api${url}`,
            params,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;

    } catch (error: any) {
        console.log(error, 'error');
        // if (error.status === 403) {
        //     window.location.href = '/login';
        //     localStorage.removeItem("token");
        // }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};

export const callApiWithTokenPhp = async (url: string, params?: any) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            DPMI + `/api${url}`,
            params,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer 4de92202e7fe0c448b65a828ed8def66f0aed37afb16dee9f1349f2935e33354863d9846c99e1e6eb8700f99703de8bcb9472017d54051152e4bcb3c7cefae1d`,
                },
            }
        );
        return response.data;

    } catch (error: any) {
        console.log(error, 'error')
        // if (error.status === 403) {
        //     // window.location.reload();
        //     window.location.href='/login'
        //     localStorage.removeItem("token");
        // }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};


export const callApiSitesApi = async (url: string, params?: any) => {

    try {
        const response: any = await axios.post(`https://nodejs-mekan-4-langdp-circle-core-test.up.railway.app/api${url}`, params);

        return response.data;
    } catch (error: any) {
        if (error.response?.status === 403) {
            localStorage.removeItem("token");
        }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};

export const integrationStaff = async (url: string, params?: any) => {
    try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
            BASE_URL_STAFF + `/api${url}`,
            params,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;

    } catch (error: any) {
        console.log(error, 'error')
        // if (error.status === 403) {
        //     // window.location.reload();
        //     window.location.href='/login'
        //     localStorage.removeItem("token");
        // }
        toast.error(error.response?.data?.error || "An error occurred");
        return error.response?.data || {error: "Unknown error"};
    }
};