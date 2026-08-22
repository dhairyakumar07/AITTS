"use client";
import {createContext,useContext,useEffect,useState} from "react";
const C=createContext<{theme:string;toggle:()=>void}>({theme:"light",toggle:()=>{}});
export function ThemeProvider({children}:{children:React.ReactNode}){const [theme,setTheme]=useState("light");useEffect(()=>{const t=localStorage.getItem("aitts-theme")||"light";setTheme(t);document.documentElement.dataset.theme=t},[]);function toggle(){const n=theme==="dark"?"light":"dark";setTheme(n);localStorage.setItem("aitts-theme",n);document.documentElement.dataset.theme=n}return <C.Provider value={{theme,toggle}}>{children}</C.Provider>}
export const useTheme=()=>useContext(C);
