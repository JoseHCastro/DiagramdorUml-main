function exportarADiagramaXMI() {
    const jsonData = myDiagram.model.toJson();
    console.log("JSON Data antes de parsear:", jsonData);

    try {
        const model = JSON.parse(jsonData);
        const now = new Date().toISOString().replace("T", " ").substring(0, 19);
        const packageId = generateUniqueId();

        const idMap = new Map();

        function getUniqueId(key) {
            if (!idMap.has(key)) {
                idMap.set(key, generateUniqueId());
            }
            return idMap.get(key);
        }

        const createTaggedValues = (tags) =>
            Object.entries(tags)
            .map(([tag, value]) => `<UML:TaggedValue tag="${tag}" value="${value}"/>`)
            .join("\n");

        const generateClasses = (nodes) =>
            nodes.map((node) => {
                    const classId = getUniqueId(node.key);
                    const attributes = (node.properties || []).map((prop, index) => {
                        const attributeId = getUniqueId(`${node.key}-prop-${index}`);
                        return `<UML:Attribute name="${prop.name}" changeable="none" visibility="${prop.visibility}" ownerScope="instance" targetScope="instance">
                        <UML:Attribute.initialValue><UML:Expression/></UML:Attribute.initialValue>
                        <UML:StructuralFeature.type><UML:Classifier xmi.idref="eaxmiid0"/></UML:StructuralFeature.type>
                        <UML:ModelElement.taggedValue>${createTaggedValues({
                            type: prop.type,
                            ea_guid: attributeId,
                            ea_localid: attributeId.replace("ID_", ""),
                            containment: "Not Specified",
                            ordered: "0",
                            collection: "false",
                            position: String(index),
                            lowerBound: "1",
                            upperBound: "1",
                            duplicates: "0",
                            styleex: "volatile=0;"
                        })}</UML:ModelElement.taggedValue>
                    </UML:Attribute>`;
                    }).join("\n");

                    const methods = (node.methods || []).map((method, index) => {
                        const methodId = getUniqueId(`${node.key}-method-${index}`);
                        const parameters = (method.parameters || []).map((param, pindex) => {
                            const paramId = getUniqueId(`${node.key}-method-${index}-param-${pindex}`);
                            return `<UML:Parameter name="${param.name}" type="${param.type}" kind="in" visibility="public">
                            <UML:ModelElement.taggedValue>
                                <UML:TaggedValue tag="ea_guid" value="${paramId}"/>
                            </UML:ModelElement.taggedValue>
                        </UML:Parameter>`;
                        }).join("\n");
                        return `<UML:Operation name="${method.name}" visibility="${method.visibility}" ownerScope="instance">
                        <UML:ModelElement.taggedValue>
                            <UML:TaggedValue tag="ea_guid" value="${methodId}"/> 
                        </UML:ModelElement.taggedValue>
                        <UML:BehavioralFeature.parameter>${parameters}</UML:BehavioralFeature.parameter>
                    </UML:Operation>`;
                    }).join("\n");

                    return `<UML:Class name="${node.name}" xmi.id="${classId}" visibility="public" namespace="EAPK_${packageId}" isRoot="false" isLeaf="false" isAbstract="false" isActive="false">
                    <UML:ModelElement.taggedValue>${createTaggedValues({
                        isSpecification: "false",
                        ea_stype: "Class",
                        ea_ntype: "0",
                        version: "1.0",
                        package: `EAPK_${packageId}`,
                        date_created: now,
                        date_modified: now,
                        gentype: "Java",
                        tagged: "0",
                        package_name: "Diagrama",
                        phase: "1.0",
                        author: "rodri",
                        complexity: "1",
                        product_name: "Java",
                        status: "Proposed",
                        tpos: "0",
                        ea_localid: classId.replace("ID_", ""),
                        ea_eleType: "element",
                        style: "BackColor=-1;BorderColor=-1;BorderWidth=-1;FontColor=-1;VSwimLanes=1;HSwimLanes=1;BorderStyle=0;"
                    })}</UML:ModelElement.taggedValue>
                    <UML:Classifier.feature>
                        ${attributes}
                        ${methods}
                    </UML:Classifier.feature>
                </UML:Class>`;
            }).join("\n");

        const generateAssociations = (links) => {
            return links.map((link) => {
                const associationId = getUniqueId(`${link.from}-${link.to}`);
                const comment = link.comment || "vacios"; // Cambio aquí: Usar un string vacío si no hay comentario

                const associationTaggedValues = {
                    style: "3",
                    ea_type: link.relationship.charAt(0).toUpperCase() + link.relationship.slice(1),
                    direction: "Source -> Destination",
                    linemode: "3",
                    linecolor: "-1",
                    linewidth: "0",
                    seqno: "0",
                    headStyle: "0",
                    lineStyle: "0",
                    ea_localid: associationId.replace("ID_", ""),
                    ea_sourceName: model.nodeDataArray.find(n => n.key === link.from)?.name || "",
                    ea_targetName: model.nodeDataArray.find(n => n.key === link.to)?.name || "",
                    ea_sourceType: "Class",
                    ea_targetType: "Class",
                    ea_sourceID: getUniqueId(link.from).replace("ID_", ""),
                    ea_targetID: getUniqueId(link.to).replace("ID_", ""),
                    src_visibility: "Public",
                    src_aggregation: "0",
                    src_isOrdered: "false",
                    src_targetScope: "instance",
                    src_changeable: "none",
                    src_isNavigable: "false",
                    src_containment: "Unspecified",
                    dst_visibility: "Public",
                    dst_aggregation: "0",
                    dst_isOrdered: "false",
                    dst_targetScope: "instance",
                    mt: comment,
                    dst_changeable: "none",
                    dst_isNavigable: "true",
                    dst_containment: "Unspecified",
                    lb: link.multiplicityFrom || "",
                    rb: link.multiplicityTo || "",
                };

                // Agregar el comentario como una etiqueta si existe
                if (comment) {
                    associationTaggedValues.documentation = comment;
                }

                let stereotypeXml = "";
                let sourceAggregation = "none";
                let targetAggregation = "none";

                switch (link.relationship) {
                    case "aggregation":
                        targetAggregation = "shared";
                        stereotypeXml = '<UML:ModelElement.stereotype><UML:Stereotype name="aggregation"/></UML:ModelElement.stereotype>';
                        break;
                    case "composition":
                        targetAggregation = "composite";
                        stereotypeXml = '<UML:ModelElement.stereotype><UML:Stereotype name="composition"/></UML:ModelElement.stereotype>';
                        break;
                    case "association":
                        associationTaggedValues.ea_type = "Association";
                        break;
                    case "dependency":
                        associationTaggedValues.ea_type = "Dependency";
                        stereotypeXml = '<UML:ModelElement.stereotype><UML:Stereotype name="dependency"/></UML:ModelElement.stereotype>';
                        associationTaggedValues.style = "1";
                        associationTaggedValues.linemode = "1";
                        break;
                    case "realization":
                        associationTaggedValues.ea_type = "Realization";
                        stereotypeXml = '<UML:ModelElement.stereotype><UML:Stereotype name="realization"/></UML:ModelElement.stereotype>';
                        associationTaggedValues.style = "4";
                        associationTaggedValues.linemode = "3";
                        break;
                    case "generalization":
                        associationTaggedValues.ea_type = "Generalization";
                        stereotypeXml = '<UML:ModelElement.stereotype><UML:Stereotype name="generalization"/></UML:ModelElement.stereotype>';
                        associationTaggedValues.style = "1";
                        associationTaggedValues.linemode = "1";
                        break;
                    default:
                        break;
                }

                return `<UML:Association name="${comment}" xmi.id="${associationId}" visibility="public" isRoot="false" isLeaf="false" isAbstract="false">
                ${stereotypeXml}
                <UML:ModelElement.taggedValue>
                    ${createTaggedValues(associationTaggedValues)}
                </UML:ModelElement.taggedValue>
                <UML:Association.connection>
                    <UML:AssociationEnd visibility="public" multiplicity="${link.multiplicityFrom || ""}" aggregation="${sourceAggregation}" isOrdered="false" targetScope="instance" changeable="none" isNavigable="false" type="${getUniqueId(link.from)}">
                        <UML:ModelElement.taggedValue>
                            <UML:TaggedValue tag="ea_end" value="source"/>
                        </UML:ModelElement.taggedValue>
                    </UML:AssociationEnd>
                    <UML:AssociationEnd visibility="public" multiplicity="${link.multiplicityTo || ""}" aggregation="${targetAggregation}" isOrdered="false" targetScope="instance" changeable="none" isNavigable="true" type="${getUniqueId(link.to)}">
                        <UML:ModelElement.taggedValue>
                            <UML:TaggedValue tag="ea_end" value="target"/>
                        </UML:ModelElement.taggedValue>
                    </UML:AssociationEnd>
                </UML:Association.connection>
            </UML:Association>`;
        }).join("\n");
        };

        const generateDiagramElements = () =>
            model.nodeDataArray.map((node) => {
                const loc = node.loc.split(" ");
                const x = parseFloat(loc[0]);
                const y = parseFloat(loc[1]);

                return `<UML:DiagramElement geometry="Left=${x};Top=${y};Right=${x + 100};Bottom=${y + 80};" subject="${getUniqueId(node.key)}" style="DUID=${generateUniqueId()};"/>`;
            }).join("\n");

        const xmiDiagram = `<UML:Diagram name="Diagrama" xmi.id="${generateUniqueId()}" diagramType="ClassDiagram" owner="EAPK_${packageId}" toolName="Enterprise Architect 2.5">
                          <UML:ModelElement.taggedValue>${createTaggedValues({
                              version: "1.0",
                              author: "rodri",
                              created_date: now,
                              modified_date: now,
                              package: `EAPK_${packageId}`,
                              type: "Logical",
                              swimlanes: "locked=false;orientation=0;width=0;inbar=false;names=false;color=-1;bold=false;fcol=0;tcol=-1;ofCol=-1;hl=1;cls=0;",
                              matrixitems: "locked=false;matrixactive=false;swimlanesactive=true;kanbanactive=false;width=1;clrLine=0;",
                              ea_localid: generateUniqueId().replace("ID_", ""),
                              EAStyle: "ShowPrivate=1;ShowProtected=1;ShowPublic=1;HideRelationships=0;Locked=0;Border=1;HighlightForeign=1;PackageContents=1;SequenceNotes=0;ScalePrintImage=0;PPgs.cx=1;PPgs.cy=1;DocSize=842,1191;ShowDetails=0;Orientation=P;Zoom=100;ShowTags=0;OpParams=1;VisibleAttributeDetail=0;ShowOpRetType=1;ShowIcons=1;CollabNums=0;HideProps=0;ShowReqs=0;ShowCons=0;PaperSize=1;HideParents=0;UseAlias=0;HideAtts=0;HideOps=0;HideStereo=0;HideElemStereo=0;ShowTests=0;ShowMaint=0;ConnectorNotation=UML 2.1;ExplicitNavigability=0;ShowShape=1;AllDockable=0;AdvancedElementProps=1;AdvancedFeatureProps=1;AdvancedConnectorProps=1;m_bElementClassifier=1;SPT=1;ShowNotes=0;SuppressBrackets=0;SuppConnectorLabels=0;PrintPageHeadFoot=0;ShowAsList=0;"
                          })}</UML:ModelElement.taggedValue>
                           <UML:Diagram.element>
                            ${generateDiagramElements()}
                          ${model.linkDataArray.map(link =>
                                `<UML:DiagramElement geometry="SX=0;SY=0;EX=0;EY=0;Path=;" subject="${getUniqueId(`${link.from}-${link.to}`)}" style=";Hidden=0;"/>
                                 <UML:DiagramElement geometry="EDGE=2;$LLB=;LLT=;LMT=;LMB=;LRT=;LRB=;IRHS=;ILHS=;" subject="${getUniqueId(`${link.from}-${link.to}`)}" style="Mode=3;EOID=53830C67;SOID=4D37A0D0;Color=-1;LWidth=0;Hidden=0;"/>`
                            ).join("\n")}
                         </UML:Diagram.element>
                       </UML:Diagram>`;

        const xmiContent = `<?xml version="1.0" encoding="UTF-8"?>
        <XMI xmi.version="1.1" xmlns:UML="omg.org/UML1.3" timestamp="${now}">
        <XMI.header>
                <XMI.documentation>
                    <XMI.exporter>Enterprise Architect</XMI.exporter>
                    <XMI.exporterVersion>2.5</XMI.exporterVersion>
                </XMI.documentation>
        </XMI.header>
       <XMI.content>
         <UML:Model name="EA Model" xmi.id="MX_${generateUniqueId()}">
          <UML:Namespace.ownedElement>
            <UML:Class name="EARootClass" xmi.id="EAID_11111111_5487_4080_A7F4_41526CB0AA00" isRoot="true" isLeaf="false" isAbstract="false"/>

            <UML:Package name="Diagrama" xmi.id="EAPK_${packageId}" isRoot="false" isLeaf="false" isAbstract="false" visibility="public">
                <UML:ModelElement.taggedValue>${createTaggedValues({
                    parent: `EAPK_${generateUniqueId()}`,
                    created: now,
                    modified: now,
                    iscontrolled: "FALSE",
                    lastloaddate: now,
                    lastsavedate: now,
                    isprotected: "FALSE",
                    usedtd: "FALSE",
                    logxml: "FALSE",
                    packageFlags: "CRC=0;",
                    batchsave: "0",
                    batchload: "0",
                    ea_stype: "Public",
                    tpos: "0",
                })}</UML:ModelElement.taggedValue>
                <UML:Namespace.ownedElement>
                    ${generateClasses(model.nodeDataArray)}
                    ${generateAssociations(model.linkDataArray)}
                </UML:Namespace.ownedElement>
             </UML:Package>
              <UML:DataType xmi.id="eaxmiid0" name="String" visibility="private" isRoot="false" isLeaf="false" isAbstract="false"/>
           </UML:Namespace.ownedElement>
         </UML:Model>
          ${xmiDiagram}
        </XMI.content>
        <XMI.difference/>
        <XMI.extensions xmi.extender="Enterprise Architect 2.5">
            <EAModel.paramSub/>
        </XMI.extensions>
      </XMI>`;

        downloadXMI(xmiContent);
    } catch (error) {
        console.error("Error al generar XMI:", error);
    }
}

// Función para descargar el contenido XMI
const downloadXMI = (content) => {
    const blob = new Blob([content], { type: "application/xml" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "diagrama.xmi";
    link.click();
    window.URL.revokeObjectURL(link.href);
};

function generateUniqueId() {
    return "ID_" + Math.random().toString(36).substr(2, 16);
}

document.getElementById("exportarXMI").onclick = exportarADiagramaXMI;