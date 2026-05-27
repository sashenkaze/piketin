import { createBrowserRouter } from "react-router-dom";
import App from "../App"; 
import Template from "../Template"
import LoginPage from "../pages/LoginPage";

// membuat daftar routing
export const router = createBrowserRouter([
    {
        path: "/",
        element: <Template />,
        children: [
            // Route untuk halaman login
            {
                path: "/", 
                element: <App />,
            },
            {
                path: "/login",
                element: <LoginPage />,
            },
        ],
    },
]);