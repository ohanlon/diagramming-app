import json
import uuid
import os

files = [
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\architecture\\flowchart\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\analytics\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\app-integration\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\blockchain\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\business-applications\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\cloud-financial-management\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\compute\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\containers\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\customer-enablement\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\database\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\developer-tools\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\end-user-computing\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\front-end-web-mobile\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\games\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\general-icons\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\internet-of-things\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\machine-learning\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\management-governance\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\media-services\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\migration-transfer\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\networking-content-delivery\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\quantum-technologies\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\robotics\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\satellite\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\security-identity-compliance\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\storage\\shapes.json",
    "C:\\ai\\diagramming-app\\diagramming-app\\public\\shapes\\aws\\vr-ar\\shapes.json"
]

for file_path in files:
    with open(file_path, 'r+') as f:
        data = json.load(f)
        modified = False
        for item in data:
            if 'id' not in item or not item['id']:
                item['id'] = str(uuid.uuid4())
                modified = True
        if modified:
            f.seek(0)
            json.dump(data, f, indent=2)
            f.truncate()
            print(f"Added missing IDs to {file_path}")

print("All files checked.")
