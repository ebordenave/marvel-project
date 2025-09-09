import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

//
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import {InputWithButton} from "./components/InputWithButton";
import {BasicSelect} from "./components/BasicSelect";
import SearchPicker from "./components/SearchPicker";

// src/App.tsx
// import { Container, Title, Stack, Text } from "@mantine/core";
// import { useState } from "react";
// import SearchPicker, { Character } from "./components/SearchPicker";

export default function App() {
    return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
            <h2>It works 🎉</h2>
            <p>If you see this, React mounted correctly.</p>
            {/*<InputWithButton/>*/}
            <SearchPicker/>
        </div>
    );
}