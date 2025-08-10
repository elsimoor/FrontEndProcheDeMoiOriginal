import { configureStore } from "@reduxjs/toolkit";
// import { toggleBetweenLandingPage } from "./toggleBetweenLandingPage"





const store = configureStore({
    reducer: {
        // toggle: toggleBetweenLandingPage.reducer,
    }
})



export type RootState   = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store;