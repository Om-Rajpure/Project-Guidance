// Curated project suggestions for intelligent onboarding
const projectSuggestions = [
    // WEB DEVELOPMENT
    {
        title: "AI-Powered Resume Analyzer",
        domain: "Web Development",
        problemStatement: "Generic resumes fail ATS systems and don't highlight key skills effectively. Job seekers need AI-driven feedback to optimize resumes for specific roles.",
        realWorldApplication: "Used by job portals like LinkedIn, HR tech startups, and career coaching platforms",
        interviewImpactScore: 8,
        whyInterviewersLike: [
            "Demonstrates AI integration with web applications",
            "Shows understanding of file parsing and NLP",
            "Practical business application with clear value"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["React", "Node.js", "Python", "NLP", "PDF parsing"]
    },
    {
        title: "Real-Time Collaborative Code Editor",
        domain: "Web Development",
        problemStatement: "Remote teams need live collaboration tools for pair programming and code reviews. Traditional editors lack real-time sync and multiplayer support.",
        realWorldApplication: "Powers products like CodeSandbox, Replit, and VS Code Live Share",
        interviewImpactScore: 9,
        whyInterviewersLike: [
            "Demonstrates WebSocket/real-time communication expertise",
            "Shows system design thinking (concurrency, conflict resolution)",
            "Complex frontend state management"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["React", "WebSocket", "Node.js", "Monaco Editor", "CRDT"]
    },
    {
        title: "Smart Expense Tracker with Receipt Scanner",
        domain: "Web Development",
        problemStatement: "Manual expense tracking is tedious and error-prone. Users need automated extraction of data from receipts using OCR and smart categorization.",
        realWorldApplication: "Used in personal finance apps, corporate expense management, accounting software",
        interviewImpactScore: 7,
        whyInterviewersLike: [
            "Combines OCR/image processing with web development",
            "Shows data visualization and analytics skills",
            "Addresses real user pain point"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["React", "Node.js", "OCR API", "Chart.js", "MongoDB"]
    },
    {
        title: "Social Media Content Scheduler with Analytics",
        domain: "Web Development",
        problemStatement: "Creators and marketers struggle to maintain consistent posting across platforms. Need automated scheduling with performance analytics.",
        realWorldApplication: "Powers tools like Buffer, Hootsuite, Later for social media management",
        interviewImpactScore: 6,
        whyInterviewersLike: [
            "Shows API integration with multiple platforms",
            "Demonstrates cron jobs and background processing",
            "Analytics and data visualization"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["React", "Node.js", "Social Media APIs", "Cron", "Analytics"]
    },
    {
        title: "Voice-Controlled Task Manager",
        domain: "Web Development",
        problemStatement: "Traditional task managers require manual input. Busy professionals need hands-free task management using voice commands.",
        realWorldApplication: "Integrated into productivity apps, smart assistants, accessibility tools",
        interviewImpactScore: 7,
        whyInterviewersLike: [
            "Shows speech recognition integration",
            "Demonstrates accessibility awareness",
            "Modern user experience innovation"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["React", "Web Speech API", "Node.js", "NLP", "MongoDB"]
    },

    // MACHINE LEARNING
    {
        title: "Fake News Detection System",
        domain: "Machine Learning",
        problemStatement: "Misinformation spreads rapidly on social media. Platforms need automated systems to detect and flag potentially fake news articles.",
        realWorldApplication: "Used by Facebook, Twitter, news aggregators for content moderation",
        interviewImpactScore: 8,
        whyInterviewersLike: [
            "Demonstrates NLP and text classification skills",
            "Shows understanding of model deployment",
            "Addresses critical real-world problem"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["Python", "TensorFlow", "NLP", "Flask", "BeautifulSoup"]
    },
    {
        title: "Disease Prediction from Medical Images",
        domain: "Machine Learning",
        problemStatement: "Early disease detection requires expert radiologists. AI can assist in screening X-rays and MRIs for abnormalities at scale.",
        realWorldApplication: "Used in hospitals, diagnostic centers, telemedicine platforms",
        interviewImpactScore: 9,
        whyInterviewersLike: [
            "Shows computer vision and deep learning expertise",
            "Healthcare AI is highly valued in industry",
            "Demonstrates model evaluation and ethics awareness"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["Python", "PyTorch", "CNN", "Medical datasets", "Flask"]
    },
    {
        title: "Customer Churn Prediction",
        domain: "Machine Learning",
        problemStatement: "Businesses lose revenue when customers leave. Predictive models can identify at-risk customers for targeted retention campaigns.",
        realWorldApplication: "Used by telecom, SaaS companies, e-commerce for customer retention",
        interviewImpactScore: 7,
        whyInterviewersLike: [
            "Shows business impact understanding",
            "Demonstrates feature engineering skills",
            "Practical ML application with ROI"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["Python", "Scikit-learn", "Pandas", "XGBoost", "Flask"]
    },
    {
        title: "Sentiment Analysis Dashboard for Product Reviews",
        domain: "Machine Learning",
        problemStatement: "E-commerce platforms receive thousands of reviews daily. Automated sentiment analysis helps businesses understand customer feedback at scale.",
        realWorldApplication: "Used by Amazon, Flipkart, product analytics platforms",
        interviewImpactScore: 7,
        whyInterviewersLike: [
            "Combines NLP with data visualization",
            "Shows end-to-end ML pipeline",
            "Real-time processing capability"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["Python", "NLP", "Dash/Streamlit", "MongoDB", "APIs"]
    },

    // ARTIFICIAL INTELLIGENCE
    {
        title: "AI-Powered Interview Coach",
        domain: "Artificial Intelligence",
        problemStatement: "Job seekers struggle with interview preparation. An AI coach can provide personalized feedback on answers, body language, and communication.",
        realWorldApplication: "Used by career platforms, universities, corporate training programs",
        interviewImpactScore: 8,
        whyInterviewersLike: [
            "Shows multi-modal AI (speech + vision)",
            "Demonstrates conversational AI skills",
            "Highly relevant to interview process itself"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["Python", "OpenAI API", "Speech-to-text", "Computer Vision", "React"]
    },
    {
        title: "Smart Study Assistant with Personalized Learning",
        domain: "Artificial Intelligence",
        problemStatement: "Students learn at different paces. An AI assistant can create personalized study plans and explain concepts based on learning style.",
        realWorldApplication: "EdTech platforms like Duolingo, Khan Academy use adaptive learning",
        interviewImpactScore: 8,
        whyInterviewersLike: [
            "Shows AI in education (growing field)",
            "Demonstrates recommendation systems",
            "Personalization and user modeling"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["Python", "NLP", "Recommendation Systems", "React", "MongoDB"]
    },
    {
        title: "Automated Code Review Assistant",
        domain: "Artificial Intelligence",
        problemStatement: "Code reviews are time-consuming. AI can automatically detect bugs, security issues, and suggest improvements in pull requests.",
        realWorldApplication: "GitHub Copilot, DeepCode, code quality tools",
        interviewImpactScore: 9,
        whyInterviewersLike: [
            "Shows understanding of software engineering + AI",
            "Highly practical for tech companies",
            "Demonstrates static analysis and ML"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["Python", "AST parsing", "LLMs", "Git APIs", "Pattern matching"]
    },

    // DATA SCIENCE
    {
        title: "Sales Forecasting Dashboard",
        domain: "Data Science",
        problemStatement: "Businesses need accurate sales predictions for inventory and resource planning. Historical data analysis can reveal trends and seasonality.",
        realWorldApplication: "Used by retail, e-commerce, manufacturing for demand planning",
        interviewImpactScore: 7,
        whyInterviewersLike: [
            "Shows time-series analysis skills",
            "Business-focused data science",
            "Interactive visualization"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["Python", "Prophet/ARIMA", "Pandas", "Plotly", "SQL"]
    },
    {
        title: "Social Media Trend Analyzer",
        domain: "Data Science",
        problemStatement: "Brands and marketers need real-time insights into trending topics, hashtags, and viral content to stay relevant.",
        realWorldApplication: "Marketing agencies, social listening tools, brand management",
        interviewImpactScore: 6,
        whyInterviewersLike: [
            "Shows API integration and data collection",
            "Real-time data processing",
            "Network analysis and visualization"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["Python", "Twitter API", "NLP", "Graph analytics", "Dash"]
    },
    {
        title: "Healthcare Data Analytics Platform",
        domain: "Data Science",
        problemStatement: "Hospitals generate massive data but lack insights. Analytics can optimize operations, reduce readmissions, and improve patient outcomes.",
        realWorldApplication: "Hospital management systems, health insurance, clinical research",
        interviewImpactScore: 8,
        whyInterviewersLike: [
            "Healthcare analytics is high-value domain",
            "Shows data privacy and ethics awareness",
            "Complex data wrangling and visualization"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["Python", "Pandas", "SQL", "Tableau/PowerBI", "Statistical analysis"]
    },

    // CYBER SECURITY
    {
        title: "Network Intrusion Detection System",
        domain: "Cyber Security",
        problemStatement: "Organizations face constant cyber threats. Real-time network monitoring can detect anomalies and prevent attacks.",
        realWorldApplication: "Used in enterprise security, firewalls, SOC (Security Operations Centers)",
        interviewImpactScore: 8,
        whyInterviewersLike: [
            "Shows understanding of network security",
            "ML applied to cybersecurity (hot field)",
            "Real-time threat detection"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["Python", "ML", "Wireshark", "Scapy", "Anomaly detection"]
    },
    {
        title: "Password Strength Analyzer with Breach Check",
        domain: "Cyber Security",
        problemStatement: "Weak passwords lead to account breaches. Users need real-time feedback on password strength and breach history.",
        realWorldApplication: "Integrated into authentication systems, password managers",
        interviewImpactScore: 6,
        whyInterviewersLike: [
            "Shows cryptography and security fundamentals",
            "API integration (HaveIBeenPwned)",
            "User-facing security tool"
        ],
        difficulty: "Beginner-friendly",
        recommendedYears: ["1st Year", "2nd Year", "3rd Year"],
        techStack: ["JavaScript", "Node.js", "Crypto libraries", "APIs", "React"]
    },
    {
        title: "Phishing Email Detector",
        domain: "Cyber Security",
        problemStatement: "Phishing attacks are the #1 entry point for breaches. Automated detection can flag suspicious emails before users click malicious links.",
        realWorldApplication: "Email security gateways, Gmail/Outlook protection, SOC tools",
        interviewImpactScore: 7,
        whyInterviewersLike: [
            "Combines ML with cybersecurity",
            "Addresses major enterprise pain point",
            "NLP and pattern recognition"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["Python", "NLP", "ML", "Email parsing", "Feature engineering"]
    },

    // BLOCKCHAIN
    {
        title: "Decentralized Voting System",
        domain: "Blockchain",
        problemStatement: "Traditional voting systems are vulnerable to fraud and lack transparency. Blockchain ensures tamper-proof, verifiable elections.",
        realWorldApplication: "Government elections, corporate governance, community decision-making",
        interviewImpactScore: 8,
        whyInterviewersLike: [
            "Shows blockchain fundamentals",
            "Smart contract development",
            "Addresses trust and transparency"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["Solidity", "Ethereum", "Web3.js", "React", "IPFS"]
    },
    {
        title: "Supply Chain Transparency Platform",
        domain: "Blockchain",
        problemStatement: "Consumers want to verify product authenticity and ethical sourcing. Blockchain provides end-to-end supply chain visibility.",
        realWorldApplication: "Used in food safety, pharma, luxury goods, fair trade",
        interviewImpactScore: 9,
        whyInterviewersLike: [
            "Real-world blockchain use case (not crypto speculation)",
            "Shows enterprise blockchain understanding",
            "IoT + Blockchain integration"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["Hyperledger", "Smart Contracts", "IoT sensors", "React", "APIs"]
    },
    {
        title: "NFT Marketplace for Digital Art",
        domain: "Blockchain",
        problemStatement: "Digital artists struggle to monetize work. NFTs enable ownership, royalties, and a marketplace for digital creations.",
        realWorldApplication: "OpenSea, Rarible, Foundation - billion-dollar NFT platforms",
        interviewImpactScore: 7,
        whyInterviewersLike: [
            "Shows understanding of NFT standards (ERC-721)",
            "Full-stack blockchain development",
            "Wallet integration and payments"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["Solidity", "Web3.js", "IPFS", "React", "Metamask"]
    },

    // IOT
    {
        title: "Smart Home Automation System",
        domain: "IoT",
        problemStatement: "Home devices lack intelligent coordination. IoT can automate lighting, climate, security based on user behavior and sensors.",
        realWorldApplication: "Google Home, Alexa ecosystem, smart home products",
        interviewImpactScore: 7,
        whyInterviewersLike: [
            "Shows IoT architecture understanding",
            "Sensor integration and automation",
            "Mobile app + hardware integration"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["Arduino/Raspberry Pi", "MQTT", "Node.js", "React Native", "Sensors"]
    },
    {
        title: "Air Quality Monitoring Network",
        domain: "IoT",
        problemStatement: "Air pollution affects public health but monitoring is limited. Distributed IoT sensors can provide real-time air quality maps.",
        realWorldApplication: "Smart cities, environmental agencies, public health monitoring",
        interviewImpactScore: 8,
        whyInterviewersLike: [
            "Shows social impact and sustainability focus",
            "Distributed systems and data aggregation",
            "Real-time dashboards and alerts"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["Raspberry Pi", "Sensors", "MQTT", "InfluxDB", "Grafana"]
    },
    {
        title: "Predictive Maintenance for Industrial Equipment",
        domain: "IoT",
        problemStatement: "Equipment failures cause costly downtime. IoT sensors + ML can predict failures before they happen.",
        realWorldApplication: "Manufacturing, aviation, energy - Industry 4.0",
        interviewImpactScore: 9,
        whyInterviewersLike: [
            "Combines IoT with ML (highly valued)",
            "Shows understanding of industrial applications",
            "Predictive analytics and anomaly detection"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["IoT sensors", "Python", "ML", "Time-series DB", "Edge computing"]
    },

    // CLOUD / DEVOPS
    {
        title: "Auto-Scaling Microservices Platform",
        domain: "Cloud / DevOps",
        problemStatement: "Applications face variable traffic. Manual scaling is slow and costly. Automated orchestration optimizes resources based on demand.",
        realWorldApplication: "AWS, Azure, GCP - foundation of cloud computing",
        interviewImpactScore: 9,
        whyInterviewersLike: [
            "Shows cloud architecture expertise",
            "Kubernetes and containerization",
            "System design and scalability thinking"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["Docker", "Kubernetes", "AWS/GCP", "Monitoring", "Load balancers"]
    },
    {
        title: "CI/CD Pipeline with Automated Testing",
        domain: "Cloud / DevOps",
        problemStatement: "Manual deployments are error-prone and slow. Automated pipelines enable rapid, reliable software delivery.",
        realWorldApplication: "Every tech company uses CI/CD - Jenkins, GitHub Actions, GitLab CI",
        interviewImpactScore: 8,
        whyInterviewersLike: [
            "Shows software engineering best practices",
            "Automation and testing mindset",
            "DevOps is critical for all companies"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["Jenkins/GitHub Actions", "Docker", "Testing frameworks", "Git", "AWS/Azure"]
    },
    {
        title: "Infrastructure Monitoring and Alerting System",
        domain: "Cloud / DevOps",
        problemStatement: "Downtime costs millions. Real-time monitoring with intelligent alerting prevents outages and ensures SLA compliance.",
        realWorldApplication: "Datadog, New Relic, Prometheus - every production system needs this",
        interviewImpactScore: 8,
        whyInterviewersLike: [
            "Shows observability and SRE principles",
            "Critical for production systems",
            "Metrics, logs, traces - full monitoring stack"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["Prometheus", "Grafana", "ELK Stack", "Cloud platforms", "Alerting"]
    },

    // APP DEVELOPMENT
    {
        title: "AI-Powered Fitness Trainer App",
        domain: "App Development",
        problemStatement: "Personal trainers are expensive. An AI-powered app can provide personalized workout plans, form correction using camera, and progress tracking.",
        realWorldApplication: "Fitness apps like Freeletics, Nike Training Club use AI coaching",
        interviewImpactScore: 7,
        whyInterviewersLike: [
            "Shows mobile AI integration",
            "Computer vision for pose detection",
            "Health tech is booming sector"
        ],
        difficulty: "Advanced",
        recommendedYears: ["3rd Year", "4th Year"],
        techStack: ["React Native/Flutter", "TensorFlow Lite", "Computer Vision", "Firebase", "APIs"]
    },
    {
        title: "Language Learning App with Speech Recognition",
        domain: "App Development",
        problemStatement: "Traditional language learning lacks speaking practice. Speech recognition enables conversational practice and pronunciation feedback.",
        realWorldApplication: "Duolingo, Babbel use AI for language learning",
        interviewImpactScore: 8,
        whyInterviewersLike: [
            "Shows speech processing integration",
            "Gamification and UX thinking",
            "Growing EdTech market"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["React Native", "Speech-to-text", "Firebase", "Gamification", "APIs"]
    },
    {
        title: "Mental Health Companion with Mood Tracking",
        domain: "App Development",
        problemStatement: "Mental health support is often inaccessible. An app can provide mood tracking, meditation, journaling, and AI-powered insights.",
        realWorldApplication: "Apps like Calm, Headspace, Wysa serve millions of users",
        interviewImpactScore: 7,
        whyInterviewersLike: [
            "Shows empathy and social impact focus",
            "Data visualization and analytics",
            "Mental health tech is growing rapidly"
        ],
        difficulty: "Intermediate",
        recommendedYears: ["2nd Year", "3rd Year", "4th Year"],
        techStack: ["React Native/Flutter", "Charts", "NLP", "Firebase", "Push notifications"]
    }
];

module.exports = projectSuggestions;
