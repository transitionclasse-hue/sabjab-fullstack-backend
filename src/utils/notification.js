import { Expo } from "expo-server-sdk";
import { Customer, DeliveryPartner, Admin } from "../models/user.js";
import { Notification } from "../models/notification.js";

const expo = new Expo();

/**
 * Send push notification to a specific user (Customer or DeliveryPartner)
 */
export const sendPushNotification = async (userId, title, body, data = {}, userType = 'Customer') => {
    try {
        let Model;
        if (userType === 'Customer') Model = Customer;
        else if (userType === 'DeliveryPartner') Model = DeliveryPartner;
        else if (userType === 'Admin') Model = Admin;

        const user = await Model.findById(userId);
        if (!user || !user.pushToken || !user.notificationsEnabled) {
            console.log(`Skipping notification for ${userId} (${userType}): No token or disabled.`);
            return null;
        }

        if (!Expo.isExpoPushToken(user.pushToken)) {
            console.error(`Push token ${user.pushToken} is not a valid Expo push token`);
            return null;
        }

        // Map sound name to Android notification channel ID
        const soundToChannelId = {
            'default': 'orders_default',
            'Siren': 'orders_siren',
            'Bell': 'orders_bell',
            'Loud Alert': 'orders_alert',
        };
        const selectedSound = user.notificationSound || 'default';
        const channelId = soundToChannelId[selectedSound] || 'orders_default';

        const messages = [{
            to: user.pushToken,
            sound: selectedSound === 'default' ? 'default' : `${selectedSound.toLowerCase().replace(' ', '_')}.mp3`,
            title,
            body,
            data,
            channelId, // Android uses this to pick the right sound channel
        }];

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error("Error sending push notification chunk:", error);
            }
        }

        // Save to history (we can track which user type it was in data or separate field if needed)
        await Notification.create({
            customer: userType === 'Customer' ? userId : null,
            // Optionally add a driver field to Notification model if tracking is needed for history
            title,
            body,
            data: { ...data, userType },
            status: "sent",
            type: "individual",
            sentAt: new Date()
        });

        return tickets;
    } catch (error) {
        console.error("sendPushNotification error:", error);
        return null;
    }
};

/**
 * Broadcast notification to all users with push tokens
 */
export const broadcastPushNotification = async (title, body, data = {}, userType = 'Customer') => {
    try {
        let Model;
        if (userType === 'Customer') Model = Customer;
        else if (userType === 'DeliveryPartner') Model = DeliveryPartner;
        else if (userType === 'Admin') Model = Admin;

        const users = await Model.find({
            pushToken: { $ne: null },
            notificationsEnabled: true
        });

        if (users.length === 0) {
            console.log(`No ${userType} with push tokens found for broadcast.`);
            return 0;
        }

        const soundToChannelId = {
            'default': 'orders_default',
            'Siren': 'orders_siren',
            'Bell': 'orders_bell',
            'Loud Alert': 'orders_alert',
        };

        const messages = [];
        for (const user of users) {
            if (Expo.isExpoPushToken(user.pushToken)) {
                const selectedSound = user.notificationSound || 'default';
                const channelId = soundToChannelId[selectedSound] || 'orders_default';
                messages.push({
                    to: user.pushToken,
                    sound: selectedSound === 'default' ? 'default' : `${selectedSound.toLowerCase().replace(' ', '_')}.mp3`,
                    title,
                    body,
                    data,
                    channelId,
                });
            }
        }

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error("Error sending broadcast chunk:", error);
            }
        }

        // Create a single history record for broadcast
        await Notification.create({
            title,
            body,
            data: { ...data, userType },
            status: "sent",
            type: "broadcast",
            sentAt: new Date()
        });

        return tickets.length;
    } catch (error) {
        console.error("broadcastPushNotification error:", error);
        return 0;
    }
};
