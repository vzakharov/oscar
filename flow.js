https = require('https')
const _ = require('lodash')

module.exports = async (a) => {

    const stageTitles = {
        translation: "Translation",     /// This and the next three refer to workflow stages
        editing: "Editing",
        proofreading: "Proofreading",
        postediting: "Post-editing"
    }

    const statusTitles = {
        created: "New",             /// This and the next one refer to project/document statuses
        completed: '✔',         
        inProgress: "In progress"
    }

    with (a) {

        //api.url = 'https://smartcat.ai/api/integration/v1/'
        
        // For testing only:
        api.options = {
            baseURL: 'https://smartcat.stage-next.sc.local/api/integration/v1/',
            auth: require('./credentials.json').smartcat_next,
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false
            })
        }

        jump(firstTime)
        
        async function firstTime() {
            put("Hey, I’m **O**scar, the **S**mart**c**at-**a**ugmenting **r**obot.")
    
            vars.firstName = await read("And you must be ...?")
        
            put("Nice to meet you, $firstName!")
        
            put("Now let’s connect to your Smartcat account. Do you know your API credentials?")
            
            choose(
                "Yes",  getCreds,
                "No", () => {}
            )
    
        }

        async function getCreds() {
            
            // Object.assign(api, {
            //     username: await read("What’s your API username?"),
            //     password: await read("And the password? (NB! Make sure to delete the message after sending!)")
            // })
    
            put("One second, let’s see if it works...")
            account = await api.get('account')
    
            jump(accountMenu)
        }

        async function accountMenu() {
            projects = await api.get('project/list')
            projects.reverse()

            put("Yay, we’re inside the **$name** account. What do you want to do now?", account)

            choose(
                (projects.length > 0) && "Manage my projects", dummy,
                "Create a new project", dummy,
                "Manage my team", dummy
            )
        }
    
        async function getProjects(options = {initial: false}) {
    
            if (options.initial) {
                put("Now let’s fetch your projects...") /// Shown the first time
            } else {
                put("Fetching your projects...") /// Shown afterwards
            }
    


            projects.forEach((p) => {
                let msg

                if (p.status == 'inProgress') {
                    msg = p.workflowStages.map((stage) => Math.round(stage.progress)).join('/') + '%'
                } else {
                    msg = statusTitles[p.status]
                }

                p.statusStr = msg
                p.wordCount = _.sum(p.documents.map(doc => doc.wordsCount))
                let langs = p.targetLanguages
                if (langs) {
                    if (langs.length > 4) {
                        p.langsStr = format("$num langs", {num:langs.length}) /// Indicates how many languages more there are
                    } else {
                        p.langsStr = langs.slice(0, 4).join("/")
                    }
                } else {
                    p.langsStr = "_"
                }
            })

            put("Here you go:")
            await choose([
                "[Create a new project]", () => newProject,
                "[Do something else]", mainMenu,
                projects, '$name ($statusStr, $sourceLanguage→$langsStr, $wordCount words)', showProject
            ])

        }
    
        async function newProject() {
            
        }

        async function showProject(p) {
    
            put("Fetching project *$name*...", p)
    
            put("Done! Here’s some project info:")

            let projectInfo = [
                ["Name", p.name],
                ["Source language", p.sourceLanguage],
                ["Target language(s)", p.targetLanguages.join(', ')],
                ["Word count", p.wordCount],
                ["Deadline", p.deadline],
                ["Created at", p.creationDate],
                ["Status", statusTitles[p.status]]
            ]
            
            projectInfo.forEach(pair => 
                glue(`${format(pair[0])}: **${pair[1]}**`)
            )

            glue("Completion percentage by stages:")
            let stages = p.workflowStages

            p.joinedStages = stages.map(stage => stageTitles[stage.stageType].toLowerCase()).join('/')
    
            stages.forEach(stage => {
                let {stageType, progress} = stage
                glue(`— ${stageTitles[stageType]}: **${Math.round(progress)}%**`)
            })
    
            put("Completion by documents ($joinedStages):", p)
    
            let docs = p.documents
    
            docs.forEach((d) => {
                let joinStages = (key) => d.workflowStages.map(stage => Math.round(stage[key]).toString()).join('/')
                d.wordsCompleted = joinStages('wordsTranslated')
                d.percentageCompleted = joinStages('progress')
                d.statusTitle = statusTitles[d.status]
                let str = format('**$name → $targetLanguage**: $statusTitle' + (d.status === 'completed' ? "": ", $wordsCompleted ($percentageCompleted%)"), d)
                glue(str)
            })
    
            await projectMenu()
        
            async function projectMenu() {
                put("What do you want to do now?")

                await choose([
                    "Auto-assign translators from my team", () => {},
                    "Go back to projects", getProjects,
                    "Check doc:", false,
                    docs, '$name → $targetLanguage', getDoc
                ])
            }

        }

        async function getDoc() {
            
        }
    }
}