const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export const diaryInputServices=async(ideaDetails)=>{
    const response = await fetch(`${API_URL}/diaryInput`,{
        method:"POST",
        headers:{
            "Content-Type": "application/json",
        },
        credentials:"include",
        body: JSON.stringify({
            title : ideaDetails.title,
            description : ideaDetails.desc,
            imageSrc : ideaDetails.imageSrc,
        }),
    })

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Failed to extract input from diary");
    }

    return data;
}