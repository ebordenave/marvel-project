import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
            refetchOnReconnect: false,
        },
    },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <MantineProvider withCssVariables withGlobalClasses>
                <App />
                <ReactQueryDevtools initialIsOpen={false} />
            </MantineProvider>
        </QueryClientProvider>
    </React.StrictMode>
);