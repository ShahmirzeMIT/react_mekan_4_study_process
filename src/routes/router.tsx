import { createBrowserRouter, RouteObject } from 'react-router-dom';

// Import all your components
import MainLayout from '../components/Layout/MainLayout';
import { Navigate } from "react-router-dom";
import CanvasNotFound from '@/pages/NotFound/CanvasNotFound';
import Login from '@/pages/Login/Login';
import { DashBoard } from '@/pages/DashBoard/DashBoard';
import { CreateClass } from '@/pages/CreateClass/CreateClass';
import { ClassUserAccess } from '@/pages/ClassUserAccess/ClassUserAccess';
import { CreatingTest } from '@/pages/CreatingTest/CreatingTest';
import { ExamAccess } from '@/pages/ExamAccess/ExamAccess';

// Routes configuration - only import structure
const routes: RouteObject[] = [
    {
        path: '/',
        element: <MainLayout />,
        errorElement: <CanvasNotFound />,
        children: [
            {
                index: true,
                element: <Navigate to="/dashboard" replace />
            },
            {
                path: "/dashboard",
                element: <DashBoard />
            },
                {
                path: "/sinif-yarat",
                element: <CreateClass />
            },
                            {
                path: "/şagird-icazeleri",
                element: <ClassUserAccess />
            },
                                        {
                path: "/test-hazirla",
                element: <CreatingTest />
            },
                                                  {
                path: "/test-icazələri",
                element: <ExamAccess />
            },
        ],
    },
    {
        path: "/login",
        element: <Login />
    },

    // Catch all route for unauthenticated access
    {
        path: "*",
        element: <Navigate to="/login" replace />
    }
];

export const router = createBrowserRouter(routes);