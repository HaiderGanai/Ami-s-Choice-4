const { SupportForm } = require("../models");


const contactSupport = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { name, email, category, subject, message } = req.body;

        if (!name || !email || !category || !subject || !message) {
            return res.status(400).json({
                message: 'name, email, category, subject, and message are all required',
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                message: 'Message must be 2000 characters or fewer',
            });
        }

        const ticket = await SupportForm.create({
            userId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            category: category.trim(),
            subject: subject.trim(),
            message: message.trim(),
        });

        return res.status(201).json({
            message: 'Support request submitted',
            ticketId: ticket.id,
        });
    } catch (err) {
        if (err.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: err.errors.map(e => e.message).join(', '),
            });
        }
        console.error('contactSupport error:', err);
        return res.status(500).json({ message: 'Failed to submit support request' });
    }
};

module.exports = { contactSupport };