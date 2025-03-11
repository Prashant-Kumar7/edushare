import { useParams } from "react-router-dom";

export function ErrorPage (){

    const {errorMessage} = useParams();
    

    return (
        <div>{errorMessage}</div>
    )
}