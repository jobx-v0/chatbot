var botui = new BotUI('botui-app');

// Start the conversation
botui.message.add({
    content: 'Hello! I am Ruthi\'s Assistant! How can I assist you today?'
}).then(function() {
    return botui.action.button({
        action: [
            { text: 'Schedule an interview', value: 'schedule' },
            { text: 'Ask a question', value: 'question' }
        ]
    });
}).then(function(res) {
    if (res.value === 'schedule') {
        scheduleInterview();
    } else if (res.value === 'question') {
        askQuestion();
    }
});

// Variables to store user input globally
let fullName, emailId, selectedDate, selectedTime;
const googleMeetLink = 'https://meet.google.com/ywa-ypkx-igt'; // Fixed Google Meet link

function scheduleInterview() {
    botui.message.add({
        content: 'Great! Let’s get started. Please provide your Full Name.'
    }).then(function() {
        return botui.action.text({
            action: { placeholder: 'Full Name' }
        });
    }).then(function(res) {
        fullName = res.value; // Store Full Name
        return botui.message.add({ content: `Thank you, ${fullName}. Please provide your Email ID.` });
    }).then(function() {
        return botui.action.text({
            action: { placeholder: 'Email ID' }
        });
    }).then(function(res) {
        emailId = res.value; // Store Email ID
        return botui.message.add({ content: 'Great! Now please select your preferred date.' });
    }).then(function() {
        const today = new Date().toISOString().split('T')[0];
        return botui.message.add({
            type: 'html',
            content: `<input type="date" id="interview-date" min="${today}">`
        });
    }).then(function() {
        return new Promise((resolve) => {
            document.getElementById("interview-date").addEventListener("change", function() {
                selectedDate = this.value;
                botui.message.add({
                    content: `You selected: ${selectedDate}. Please choose a time.`
                }).then(function() {
                    return botui.message.add({
                        type: 'html',
                        content: `<input type="time" id="interview-time">`
                    });
                }).then(function() {
                    return new Promise((resolve) => {
                        document.getElementById("interview-time").addEventListener("change", function() {
                            selectedTime = this.value;
                            const time12HourFormat = convertTo12Hour(selectedTime);
                            botui.message.add({
                                content: `Interview scheduled for ${selectedDate} at ${time12HourFormat}.`
                            });

                            // Send the interview details to the server to schedule the email and WebSocket message
                            scheduleInterviewEmail(fullName, emailId, selectedDate, selectedTime);
                            resolve();
                        });
                    });
                });
            });
        });
    });
}

// Function to convert time to 12-hour format with AM/PM
function convertTo12Hour(time) {
    const [hours, minutes] = time.split(':');
    const hours12 = (hours % 12) || 12;
    const ampm = hours < 12 ? 'AM' : 'PM';
    return `${hours12}:${minutes} ${ampm}`;
}

// Function to send interview scheduling data to the server
function scheduleInterviewEmail(fullName, emailId, date, time) {
    if (!date || !time) {
        console.error('Date or time is missing.');
        return;
    }
    
    const interviewDateTime = new Date(`${date}T${time}:00`);
    console.log('Scheduling interview for:', interviewDateTime);

    fetch('http://localhost:3000/schedule-interview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fullName,
            emailId,
            interviewDateTime: interviewDateTime.toISOString()
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        botui.message.add({
            content: `${data.message}. The interview link will expire 2 hours after the scheduled time.`
        });
    })
    .catch(error => {
        botui.message.add({
            content: 'Failed to schedule interview: ' + error.message
        });
    });
}

function askQuestion() {
    botui.message.add({
        content: 'Sure, what’s your question?'
    }).then(function() {
        return botui.action.text({
            action: {
                placeholder: 'Type your question here'
            }
        });
    }).then(function(res) {
        botui.message.add({
            content: 'You asked: ' + res.value
        });
    });
}

// WebSocket to listen for reminders one hour before the interview
const ws = new WebSocket('ws://localhost:8080'); // Connect to the WebSocket server

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    botui.message.add({
        content: `${data.message} Join the interview <a href="${googleMeetLink}" target="_blank">here</a>.` // Display the WebSocket message in the chat
    });
};
