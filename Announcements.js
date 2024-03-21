document.addEventListener("DOMContentLoaded", function() {
    // Assuming 'announcementsData' is an array containing announcement objects
    const announcementsData = [
        {
            title: "New Event Launch",
            image: "product.jpg",
            content: "We are excited to announce the launch of our new home ed server. Check out the video below for more information.",
            video: "product_launch_video.mp4"
        },
        {
            title: "Upcoming Event",
            image: "images/Minecraft_airport_image.jpg",
            content: "Join us for our upcoming event happening next week. Stay tuned for more details!",
            video: "videos/stanstedAirportVideo.mp4"
        },
        // Add more announcements as needed
    ];

    const announcementContainer = document.getElementById("announcement");

    announcementsData.forEach(announcement => {
        
        const announcementElement = document.createElement("div");
        announcementElement.classList.add("announcement");

        const titleElement = document.createElement("h2");
        titleElement.textContent = announcement.title;

        const imageElement = document.createElement("img");
        imageElement.src = announcement.image;
        imageElement.alt = announcement.title;

        const contentElement = document.createElement("p");
        contentElement.textContent = announcement.content;

        announcementElement.appendChild(titleElement);
        announcementElement.appendChild(imageElement);
        announcementElement.appendChild(contentElement);

        if (announcement.video) {
            const videoElement = document.createElement("video");
            videoElement.src = announcement.video;
            videoElement.controls = true;

            announcementElement.appendChild(videoElement);
        }

        announcementContainer.appendChild(announcementElement);
    });
});