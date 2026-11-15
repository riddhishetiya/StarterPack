const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";


export const diaryInput = async (ideaDetails) => {
    const formData = new FormData();

    formData.append("title", ideaDetails.title);
    formData.append("description", ideaDetails.desc);

    if (ideaDetails.imageFile) {
        formData.append("image", ideaDetails.imageFile);
    }

    const response = await fetch(`${API_URL}/diary/input`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Failed to extract input from diary");
    }

    return data;
};


export const ideasFetch = async () => {
    const response = await fetch(`${API_URL}/diary/ideas-fetch`, {
        method: "GET",
        credentials: "include",
    })
    if (!response.ok) {
        if (response.status === 401) {
            return null;
        }

        throw new Error("Unable to fetch idea");
    }

    const data = await response.json();

    return data;
}