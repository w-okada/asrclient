import { createGlobalTheme, createTheme, globalStyle, style } from "@vanilla-extract/css";

export const globaVars = createGlobalTheme(":root", {
    color: {
        companyColor1: "rgba(64, 119, 187, 1)",
        companyColor2: "rgba(29, 47, 78, 1)",
        companyColor3: "rgba(255, 255, 255, 1)",
        dialogBackgroundColor: "rgba(255, 255, 255, 1)",
        dialogBorderColor: "rgba(100, 100, 100, 1)",
        dialogShadowColor: "rgba(0, 0, 0, 0.3)",
        textColor: "#333",
    },
});

export const [defaultTheme, vars] = createTheme({
    color: {
        brand: "blue",
        white: "#fff",
        red: "red",
    },
    space: {
        small: "4px",
        medium: "8px",
    },
});

export const othreTheme = createTheme(vars, {
    color: {
        brand: "green",
        white: "#fff",
        red: "red",
    },
    space: {
        small: "4px",
        medium: "8px",
    },
});

globalStyle("*", {
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
    fontFamily: '"Poppins", sans-serif',
});

globalStyle("html", {
    fontSize: "16px",
});
globalStyle("body", {
    height: "100%",
    width: "100%",
    overflowY: "scroll",
    overflowX: "hidden",
    color: globaVars.color.textColor,
    background: `linear-gradient(45deg, ${globaVars.color.companyColor1} 0, 1%, ${globaVars.color.companyColor2} 1% 5%, ${globaVars.color.companyColor3} 5% 90%, ${globaVars.color.companyColor1} 90% 95%, ${globaVars.color.companyColor2} 95% 100%)`,
    padding: "0rem 2rem 2rem 2rem",
    userSelect: "none",
});

export const left1Padding = style({
    paddingLeft: "1rem",
});
export const left3Padding = style({
    paddingLeft: "3rem",
});

export const loggerDiv = style({
    userSelect: "text",
    width: "100%",
    height: "100%",
});
export const loggerArea = style({
    height: "80%",
    overflowY: "scroll",
});
export const logLine = style({
    whiteSpace: "nowrap",
});
export const decoratedWordRed = style({
    color: "red",
    fontWeight: 700,
});
export const decoratedWordBlue = style({
    color: "blue",
    fontWeight: 700,
});
export const decoratedWordGreen = style({
    color: "green",
    fontWeight: 700,
});

export const loggerControlArea = style({
    height: "3rem",
    marginTop: "1rem",
});
export const loggerControlButton = style({
    width: "3rem",
    margin: "0.5rem",
    background: "rgba(255, 255, 255, 0.5)",
});

export const errorBoundaryContainer = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "start",
    justifyContent: "center",
    height: "100vh",
    userSelect: "text",
    gap: "0.5rem",
});

export const errorBoundaryTitle = style({
    fontSize: "1.5rem",
});
export const errorBoundaryName = style({
    fontSize: "1.2rem",
});

export const errorBoundaryMessage = style({
    fontSize: "1.2rem",
});
export const errorBoundaryInfo = style({
    fontSize: "1rem",
});
