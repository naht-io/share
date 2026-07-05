import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: [
      "@tiptap/extensions",
      "@tiptap/react",
      "@tiptap/react/menus",
      "@tiptap/pm/state",
      "@tiptap/starter-kit",
      "class-variance-authority",
      "date-fns",
      "lucide-react",
      "motion/react",
      "react-aria-components",
      "react-dom",
    ],
  },
});
