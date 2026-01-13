import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast"; // Assuming this hook exists

// Define the shape of your user data
interface User {
  name: string;
  email: string;
  token: string;
}

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
//   login: (userData: User) => void;
//   logout: () => void;
//   isLoading: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- AuthProvider Component ---
// This component will wrap your entire app
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Check for existing login on load
  const { toast } = useToast();

  // On initial load, check localStorage for existing user data
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("kavach_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("kavach_user");
    } finally {
      setIsLoading(false); // Done checking
    }
  }, []);

  // Login function
  const login = (userData: User) => {
    try {
      localStorage.setItem("kavach_user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Failed to save user to localStorage", error);
      toast({
        title: "Storage Error",
        description: "Could not save user session.",
        variant: "destructive",
      });
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("kavach_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser}}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// --- Custom Hook ---
// This makes it easy to access the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};