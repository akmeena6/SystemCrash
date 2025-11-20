import { createContext, useState } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authCreds, setAuthCreds] = useState({
    user_id: 0,
    name: "",
    email: "",
    active: 0,
    // add the profile picture here
    profile_pic: "",
    // add the notifications
    notifications: [],
    hashed_password: "",
  });

  return (
    <AuthContext.Provider
      value={{ authCreds, setAuthCreds, isLoggedIn, setIsLoggedIn }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export default AuthContext;
