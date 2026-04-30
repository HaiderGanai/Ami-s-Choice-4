const DeliverSlot = require("../models/deliverySlotModel");


const getAvailableSlots = async (req, res) => {
    try {
        const now = new Date();
        const currentTme = now.toTimeString().slice(0, 8);

        const allSlots = await DeliverSlot.findAll({
            where: { isActive: true },
            order: [[ 'sortOrder', 'ASC' ]]
        });

        const availableSlots = allSlots.filter(slot => currentTme <= slot.cutoffTime).map(slot => {
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + slot.offsetDays);
            const dateStr = deliveryDate.toLocaleDateString('en-PK', {
                weekday: 'long', month: 'short', day: 'numeric'
            });
            
            return {
                id: slot.id,
                label: slot.label,
                windowLabel: dateStr,
                displayText: `${dateStr}, ${slot.windowLabel}`
            };
        });
        return res.status(200).json({
            status: 'success',
            message: 'Avaialble delivery slots',
            data: availableSlots
        })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'fail',
            message: 'Could not fetch delivery slots'
        })
    }
}

module.exports = { getAvailableSlots };