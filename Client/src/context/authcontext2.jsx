import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Demo accounts - these are pre-seeded for the demo flow
const DEMO_ACCOUNTS = [
  {
    email: "user@demo.com",
    password: "Demo@123",
    user: {
      id: "user-demo-1",
      name: "Demo User",
      email: "user@demo.com",
      role: "user",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=DU",
    },
  },
  {
    email: "organizer@demo.com",
    password: "Demo@123",
    user: {
      id: "organizer-1",
      name: "Demo Organizer",
      email: "organizer@demo.com",
      role: "organizer",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=DO",
    },
  },
  {
    email: "admin@demo.com",
    password: "Demo@123",
    user: {
      id: "admin-1",
      name: "Demo Admin",
      email: "admin@demo.com",
      role: "admin",
      avatar: "https://api.dicebear.com/7.x/initials/svg?seed=DA",
    },
  },
];

const USERS_STORAGE_KEY = "sem_users";
const CURRENT_USER_KEY = "sem_user";

// Initialize users storage with demo accounts
const initializeUsers = () => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    const users = JSON.parse(stored);
    // Ensure demo accounts exist
    const existingEmails = users.map(u => u.email);
    const missingDemo = DEMO_ACCOUNTS.filter(d => !existingEmails.includes(d.email));
    if (missingDemo.length > 0) {
      const updatedUsers = [...users, ...missingDemo.map(d => d.user)];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      return updatedUsers;
    }
    return users;
  }
  // First time - seed demo accounts
  const initialUsers = DEMO_ACCOUNTS.map(d => d.user);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
  return initialUsers;
};

// Password storage (separate for security demo purposes - in real app use proper hashing)
const PASSWORDS_STORAGE_KEY = "sem_passwords";

const initializePasswords = () => {
  const stored = localStorage.getItem(PASSWORDS_STORAGE_KEY);
  if (stored) {
    const passwords = JSON.parse(stored);
    // Ensure demo passwords exist
    let updated = false;
    DEMO_ACCOUNTS.forEach(d => {
      if (!passwords[d.email]) {
        passwords[d.email] = d.password;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
    }
    return passwords;
  }
  // First time - seed demo passwords
  const initialPasswords = {};
  DEMO_ACCOUNTS.forEach(d => {
    initialPasswords[d.email] = d.password;
  });
  localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(initialPasswords));
  return initialPasswords;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Initialize users and passwords
    initializeUsers();
    initializePasswords();

    // Check for stored auth on mount
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email, password) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const normalizedEmail = email.toLowerCase().trim();

    // Check passwords
    const passwords = JSON.parse(localStorage.getItem(PASSWORDS_STORAGE_KEY) || "{}");
    const storedPassword = passwords[normalizedEmail];

    if (!storedPassword) {
      return { success: false, role: null, error: "Account not found. Please sign up first." };
    }

    if (storedPassword !== password) {
      return { success: false, role: null, error: "Invalid password. Please try again." };
    }

    // Find user
    const allUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    const foundUser = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!foundUser) {
      return { success: false, role: null, error: "User data not found." };
    }

    setUser(foundUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(foundUser));

    return { success: true, role: foundUser.role };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const signup = async (name, email, password) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const allUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    if (allUsers.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: "An account with this email already exists." };
    }

    // Create new user (always as "user" role by default)
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      name: name.trim(),
      email: normalizedEmail,
      role: "user",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };

    // Save user
    const updatedUsers = [...allUsers, newUser];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    // Save password
    const passwords = JSON.parse(localStorage.getItem(PASSWORDS_STORAGE_KEY) || "{}");
    passwords[normalizedEmail] = password;
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));

    // Auto-login after signup
    setUser(newUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

    return { success: true };
  };

  const getAllUsers = () => {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, signup, getAllUsers }}>
      {children}
    </AuthContext.Provider>
  );
};
