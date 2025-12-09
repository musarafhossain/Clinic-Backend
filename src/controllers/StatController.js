import StatModel from '../models/StatModel.js';

const getHomeStats = async (req, res, next) => {
    try {
        const today = req.query.today || "";
        const data = await StatModel.getHomeStats(today);

        return res.status(200).json({
            success: true,
            message: "Stats data retrieved successfully",
            data: data
        });

    } catch (error) {
        next(error);
    }
};

export default {
    getHomeStats
};