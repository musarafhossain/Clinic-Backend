import db from '../config/db.js';

const getHomeStats = async (today) => {
    const currentDate = today ? new Date(today) : new Date();
    //const todayStr = currentDate.toISOString().split("T")[0];
    const todayStr = '2025-12-10';

    const [todayAttendanceRows] = await db.execute(
        `SELECT COUNT(*) AS count 
         FROM attendances 
         WHERE DATE(datetime) = ?`,
        [todayStr]
    );
    const todays_attendance = todayAttendanceRows[0].count;

    const [todayRevenueRows] = await db.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total 
         FROM transactions 
         WHERE DATE(created_at) = ?`,
        [todayStr]
    );
    const todays_revenue = todayRevenueRows[0].total;

    const [patientStatsRows] = await db.execute(
        `SELECT 
            COUNT(*) AS total,
            COUNT(CASE WHEN status = 'ONGOING' THEN 1 END) AS ongoing,
            COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed,
            COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled
         FROM patients`
    );

    const patientStats = patientStatsRows[0];

    const [attendance7Rows] = await db.execute(
        `SELECT 
            DATE(datetime) AS day,
            COUNT(*) AS count
         FROM attendances
         WHERE datetime >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY DATE(datetime)
         ORDER BY day ASC`
    );

    const last7 = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        const row = attendance7Rows.find(r => {
            const rKey = new Date(r.day).toISOString().split("T")[0];
            return rKey === key;
        });

        last7.push(row ? row.count : 0);
    }

    return {
        todays_stats: {
            todays_attendance,
            todays_revenue,
        },
        patients_stats: {
            total_patient: patientStats.total,
            ongoing_patient: patientStats.ongoing,
            completed_patient: patientStats.completed,
            cancelled_patient: patientStats.cancelled,
        },
        last_7_days_attendance: last7,
    };
};

export default {
    getHomeStats,
}
