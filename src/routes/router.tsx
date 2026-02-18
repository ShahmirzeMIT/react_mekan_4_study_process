import { createBrowserRouter, RouteObject } from 'react-router-dom';

// Import all your components
import MainLayout from '../components/Layout/MainLayout';
import { Navigate } from "react-router-dom";
import CanvasNotFound from '@/pages/NotFound/CanvasNotFound';
import Login from '@/pages/Login/Login';
import { DashBoard } from '@/pages/DashBoard/DashBoard';
import { Lessons } from '@/pages/Lessons/Lessons';
import { FinishedLesson } from '@/pages/FinishedLesson/FinishedLesson';
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
                path: "/dərslər",
                element: <Lessons />
            },
                            {
                path: "/bitən-dərslər",
                element: <FinishedLesson />
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