const _ = require('lodash')

module.exports = async (a) => {

    const stageTitles = {
        translation: "Translation",     /// This and the next three refer to workflow stages
        editing: "Editing",
        proofreading: "Proofreading",
        postediting: "Post-editing"
    }

    const statusTitles = {
        created: "Created",             /// This and the next one refer to project/document statuses
        completed: "Completed",         
        inProgress: "In progress"
    }

    with (a) {
        
        api.url = 'https://smartcat.ai/api/integration/v1/'
        
        put("Hey, I’m **O**scar, the **S**mart**c**at-**a**ugmenting **r**obot.")
    
        vars.firstName = await read("And you must be ...?")
    
        put("Nice to meet you, $firstName!")
    
        put("Now let’s connect to your Smartcat account. Do you know your API credentials?")
        
        await choose([
            "Yes",  getCreds,
            "No", () => {}
        ])
        
        async function getCreds() {
            
            // Object.assign(api, require('./credentials.json').smartcat)
            Object.assign(api, {
                username: await read("What’s your API username?"),
                password: await read("And the password? (NB! Make sure to delete the message after sending!)")
            })
    
            put("One second, let’s see if it works...")
            let account = await api.get('account')
    
            put("Yay, account *$name* successfully loaded!", account)
    
            await getProjects({initial: true})
        }
    
        async function getProjects(options = {initial: false}) {
    
            if (options.initial) {
                put("Now let’s fetch your projects...") /// Shown the first time
            } else {
                put("Fetching your projects...") /// Shown afterwards
            }
    
            let projects = (await api.get('project/list')).reverse()   

            projects.forEach((p) => {
                let msg

                if (p.status == 'inProgress') {
                    msg = p.workflowStages.map((stage) => Math.round(stage.progress)).join('/') + '%'
                } else {
                    msg = statusTitles[p.status]
                }

                p.statusMessage = msg
            })

            put("Here you go:")
            await choose([
                "[Create a new project]", newProject,
                "[Do something else]", mainMenu,
                projects, '$name ($statusMessage)', showProject
            ])

        }
    
        async function mainMenu() {

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
                ["Word count", _.sum(p.documents.map(doc => doc.wordsCount))],
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