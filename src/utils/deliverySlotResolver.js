const DeliverSlot = require("../models/deliverySlotModel");


const resolveDeliverySlot = async () => {
    //Get current time as HH:MM:SS for comparison
    const now = new Date();
    const currentTme = now.toTimeString().slice(0, 8); // HH:MM:SS

    //Fetch active slots ordered by sortOrder
    const slots = await DeliverSlot.findAll({
        where: { isActive: true },
        order: [[ 'sortOrder', 'ASC' ]]
    });

    //First slot whose cutoffTime is still ahead of current time wins
    const matched = slots.find(slot => currentTme <= slot.cutoffTime);

    if(!matched) return null;

    //Calculate the delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + matched.offsetDays);
    const dateStr = deliveryDate.toLocaleDateString('en-PK', {
        weekday: 'long', month: 'short', day: 'numeric'
    });

    return {
        slotId: matched.id,
        label: matched.label,
        windowLabel: matched.windowLabel,
        deliveryDate: dateStr,
        displayText: `${dateStr}, ${matched.windowLabel}` //Monday, Apr 28, 4:00 PM
    };
};

module.exports = { resolveDeliverySlot };