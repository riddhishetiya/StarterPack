import { pool } from "../config/db.js"
import { cloudinary } from "../config/cloudinary.js";

export const saveDiaryInput = async (req, res) => {
    try {
        const creatorId = req.user.userId;

        let imageSrc = null;
        // Upload image to Cloudinary if one was selected
        if (req.file) {
            const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "ideas" },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                stream.end(req.file.buffer);
            });

            imageSrc = uploadResult.secure_url;
        }

        const result = await pool.query(
            `INSERT INTO "Ideas"
            (creator_id, title, description, image_src, category_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [
                creatorId,
                req.body.title,
                req.body.description,
                imageSrc,
                req.body.categoryId
            ]
        );

        res.status(201).json({
            message: "Diary saved successfully",
            diary: result.rows[0],
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Failed to save diary",
        });
    }
};


export const ideasFetch = async(req,res)=>{
    try{
        const result = await pool.query(
            `SELECT id,image_src,category_id
            FROM "Ideas"`
        )
        // console.log("Result : ",result.rows)
        res.status(200).json(result.rows)
    }
    catch(error){
        console.log(error)
        res.status(500).json({
            message : "Failed to fetch ideas",
        })
    }
}