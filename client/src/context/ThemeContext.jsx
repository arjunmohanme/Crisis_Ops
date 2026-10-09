import {
  useEffect,
  useState,
} from "react";

import ThemeContext from "./themeContext";

const STORAGE_KEY = "crisisops_theme";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  const savedTheme =
    localStorage.getItem(STORAGE_KEY);

  return savedTheme === "dark"
    ? "dark"
    : "light";
}

function ThemeProvider({ children }) {
  const [theme, setTheme] =
    useState(getInitialTheme);

  useEffect(() => {
    const root =
      document.documentElement;

    root.classList.remove(
      "light",
      "dark"
    );

    root.classList.add(theme);
    root.style.colorScheme = theme;

    localStorage.setItem(
      STORAGE_KEY,
      theme
    );
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) =>
      current === "light"
        ? "dark"
        : "light"
    );
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeProvider };
export default ThemeProvider;