import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Demo accounts
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

const initializeUsers = () => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (stored) {
    const users = JSON.parse(stored);
    const existingEmails = users.map(u => u.email);
    const missingDemo = DEMO_ACCOUNTS.filter(d => !existingEmails.includes(d.email));
    if (missingDemo.length > 0) {
      const updatedUsers = [...users, ...missingDemo.map(d => d.user)];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      return updatedUsers;
    }
    return users;
  }
  const initialUsers = DEMO_ACCOUNTS.map(d => d.user);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
  return initialUsers;
};

const PASSWORDS_STORAGE_KEY = "sem_passwords";

const initializePasswords = () => {
  const stored = localStorage.getItem(PASSWORDS_STORAGE_KEY);
  if (stored) {
    const passwords = JSON.parse(stored);
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
    initializeUsers();
    initializePasswords();

    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email, password) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const normalizedEmail = email.toLowerCase().trim();

    const passwords = JSON.parse(localStorage.getItem(PASSWORDS_STORAGE_KEY) || "{}");
    const storedPassword = passwords[normalizedEmail];

    if (!storedPassword) {
      return { success: false, role: null, error: "Account not found. Please sign up first." };
    }

    if (storedPassword !== password) {
      return { success: false, role: null, error: "Invalid password. Please try again." };
    }

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
    await new Promise(resolve => setTimeout(resolve, 500));

    const normalizedEmail = email.toLowerCase().trim();

    const allUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]");
    if (allUsers.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: "An account with this email already exists." };
    }

    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      name: name.trim(),
      email: normalizedEmail,
      role: "user",
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    };

    const updatedUsers = [...allUsers, newUser];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));

    const passwords = JSON.parse(localStorage.getItem(PASSWORDS_STORAGE_KEY) || "{}");
    passwords[normalizedEmail] = password;
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));

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
