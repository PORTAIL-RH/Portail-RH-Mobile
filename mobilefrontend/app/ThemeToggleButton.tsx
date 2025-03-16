import { useTheme } from "./ThemeContext";

const ThemeToggleButton = () => {
  const { toggleTheme } = useTheme();

  return (
    <TouchableOpacity onPress={toggleTheme}>
      <Text>Toggle Theme</Text>
    </TouchableOpacity>
  );
};