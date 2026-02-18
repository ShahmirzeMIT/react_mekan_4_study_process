import { message } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const useAuthCheck = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  useEffect(() => {
    if (!token) {
      navigate("/login"); // no token, go to home get the fuck out of my project blyat
      message.error('You are not authorized'); 
      return;
    }

  
  }, [token]);
  
};

export default useAuthCheck;
