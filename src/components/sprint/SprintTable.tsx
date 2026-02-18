import { RootState, useAppSelector } from '@/store'
import useSprintAllSprint from '@/ui-canvas/canvas_sprint/actions/useSprintAllSprint'
import { SprintContext } from '@/ui-canvas/canvas_sprint/sprintContext'
import services from '@/ui-canvas/ui_backlog_canvas/services/backlogService'
import { Table, TableProps, Tag } from 'antd'
import { BugOutlined } from '@ant-design/icons';
import { useContext, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { setDate } from 'date-fns'
import BacklogTableDrawer from '@/ui-canvas/ui_backlog_canvas/components/componentElemets/BacklogTableDrawer'
import { useProjectUsers } from '@/hooks/useProjectUsers'

const SprintTable = () => {
    const [tableData, setTableData] = useState<any>({})
    const [flag, setFlag] = useState<boolean>(false)
    interface ColumnsElementType {
        assigne: string,
        sprint: any,
        key?: string,
        photoURL?: string,
        uid?: string
    }

    interface IssueType {
        id: string;
        assignee?: string;
        assigneeId?: string;
    }

    const checkColor = (arg: string) =>
        arg === "draft" ? "bg-[#C8C8C8] text-black"
            : arg === "new" ? "bg-[#FFA500] text-black"
                : arg === "closed" ? "bg-blue-500 text-white"
                    : arg === "canceled" ? "bg-red-500 text-white"
                        : arg === "ongoing" ? "bg-[#008000] text-white"
                            : "bg-[#9ACD32] text-black";

    const { sprints } = useSprintAllSprint()
    const { selectedItems } = useContext(SprintContext)
    const currentProject = useSelector((state: RootState) => state.project.currentProject)
    const { projectUsers } = useProjectUsers()

    const [issues, setIssues] = useState<IssueType[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchIssues = async () => {
            if (!currentProject?.id) return

            setLoading(true)
            try {
                const issuesData = await services.getTasks(currentProject.id)
                setIssues(issuesData || [])
            } catch (error) {
                console.error('Error fetching issues:', error)
                setIssues([])
            } finally {
                setLoading(false)
            }
        }

        fetchIssues()
    }, [currentProject?.id])

    const columns: TableProps<ColumnsElementType>["columns"] = [
        {
            title: "Assignee",
            key: 'assigne',
            dataIndex: "assigne",
            render: (_, record) => (
                <div className='flex items-center gap-2'>
                    <div className='w-6 h-6 overflow-hidden rounded-full'>
                        <img
                            className='w-full h-full object-cover'
                            src={record?.photoURL}
                            alt={record?.assigne}
                        />
                    </div>
                    <span>{record?.assigne}</span>
                </div>
            )
        },
        ...sprints
            .filter(elem => selectedItems.includes(elem.sprintName))
            .map(sprintItem => {
                return {
                    title: sprintItem?.sprintName,
                    key: sprintItem?.sprintName.toLowerCase(),
                    dataIndex: sprintItem?.sprintName.toLowerCase(),
 
                    render: (_, record) => {
                        
                        const userIssues = issues.filter(item => {
                            return sprintItem?.ids?.includes(item?.id) && item.assignee === record.uid
                        })

                        const issueCount = userIssues.length

                        if (issueCount === 0) {
                            return <div>-</div>
                        }

                        const issueSH = userIssues?.reduce((acc, item: any) => acc + (item?.sh || 0), 0)
                        const issueEH = userIssues?.reduce((acc, item: any) => acc + (item?.eh || 0), 0)

                        const statuses = userIssues?.reduce((acc, item: any) => {
                            const status = item?.status || ""
                            acc[status] = (acc[status] || 0) + 1
                            return acc
                        }, {})

                        const types = userIssues?.reduce((acc, item: any) => {
                            const type = item?.type || ""
                            acc[type] = (acc[type] || 0) + 1
                            return acc
                        }, {})

                        return (
                            <div className="text-black flex flex-col gap-1">
                                <div className='flex items-center gap-2'>
                                    <span className='cursor-pointer hover:underline font-bold'
                                        onClick={() => { setFlag(true); setTableData({ ids: sprintItem?.ids, assignee: record.uid }) }}>
                                        Issues: {issueCount}
                                    </span>
                                    <span className='cursor-pointer hover:underline '>
                                        {Object.entries(types).map(([key, value]: any, index) =>
                                            <Tag onClick={() => { setFlag(true); setTableData({ ids: sprintItem?.ids, type: key, assignee: record.uid }) }}
                                                className={`${key == "Bug" ? "bg-red-500 text-white" : ""}`}
                                                key={index} >
                                                {key == "Bug" ? <BugOutlined /> : ""} {key} : {value}
                                            </Tag>
                                        )}
                                    </span>
                                </div>
                                {issueEH ? <span className='text-red-500'><b>EH:</b> {issueEH}</span> : ""}
                                {issueSH ? <span className='text-green-500'><b>SH:</b> {issueSH}</span> : ""}
                                <div className='cursor-pointer hover:underline '>
                                    {Object.entries(statuses).map(([key, value]: any, index) =>
                                        <Tag onClick={() => { setFlag(true); setTableData({ ids: sprintItem?.ids, status: key, assignee: record.uid }) }}
                                            className={`${checkColor(key)}`}
                                            key={index} >
                                            {key} : {value}
                                        </Tag>
                                    )}
                                </div>
                            </div>
                        )
                    }
                }
            })
    ]

    const data: ColumnsElementType[] = projectUsers
        ?.filter((item: any) => item?.displayName)
        .map((item: any) => ({
            key: item.uid || item.displayName,
            assigne: item.displayName,
            uid: item.uid,
            sprint: "sprint",
            photoURL: item.photoURL
        })) || []

    return (
        <>
            <Table
                loading={loading}
                pagination={false}
                dataSource={data}
                columns={columns}
            />
            <BacklogTableDrawer open={flag} onClose={() => setFlag(false)} data={tableData} />
        </>
    )
}

export default SprintTable