
import Gamification from "../models/Gamification.js";
import Task from "../models/Task.js";
import Reflection from "../models/Reflection.js";

export const getStats = async (req, res) => {
  try {
    let gamification = await Gamification.findOne({ userId: req.userId });
    if (!gamification) {
      // Create if missing
      gamification = await Gamification.create({ userId: req.userId });
    }
    res.json(gamification);
  } catch (err) {
    console.error("Get gamification stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export const getActivity = async (req, res) => {
    try {
        // Simple aggregation of completed tasks and reflections for the heatmap
        // Get last 90 days
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const tasks = await Task.find({ 
            userId: req.userId, 
            completed: true, 
            updatedAt: { $gte: ninetyDaysAgo } 
        }, 'updatedAt');
        
        const reflections = await Reflection.find({
            userId: req.userId,
            createdAt: { $gte: ninetyDaysAgo }
        }, 'createdAt');
        
        // Merge and format
        const activityMap = {};
        
        [...tasks, ...reflections].forEach(item => {
            const date = (item.updatedAt || item.createdAt).toISOString().split('T')[0];
            activityMap[date] = (activityMap[date] || 0) + 1;
        });
        
        const activityList = Object.keys(activityMap).map(date => ({
            date,
            count: activityMap[date]
        }));
        
        res.json(activityList);
    } catch (err) {
        console.error("Get activity error:", err);
        res.status(500).json({ error: "Failed to fetch activity" });   
    }
};
