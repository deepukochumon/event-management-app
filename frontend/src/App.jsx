import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563eb' },
    secondary: { main: '#7c3aed' },
    background: { default: '#f8fafc' }
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: ['Inter', 'system-ui', 'sans-serif'].join(',')
  }
})

function PlaceholderPage({ title }) {
  return (
    <Box sx={{ p: 4 }}>
      <h1>{title}</h1>
      <p>Frontend shell is wired. Additional routed views are implemented in the remaining bundle files.</p>
    </Box>
  )
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<PlaceholderPage title="Event Management Dashboard" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  )
}
