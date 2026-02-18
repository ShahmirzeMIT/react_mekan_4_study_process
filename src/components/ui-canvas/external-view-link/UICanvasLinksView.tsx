export default function UICanvasLinksView({selectedLink, externalLinkData}) {
    const data = externalLinkData?.find(item => item.id == selectedLink?.id);
    return (
        data && <div className="p-4 border border-[#f0f0f0]">
            {/* Başlıq + Select */}

            <div className="flex justify-between items-center mb-4">
                    <span>{data?.title}</span>
            </div>

            {/* Sadece resim preview */}

            {data && (
                <div className="text-center w-full max-w-[700px] h-fit">
                    {data?.type === "image" && <>
                        <img
                            src={data?.url || data?.image || ''}
                        alt="External View"
                        className="w-full h-full object-contain"
                        />
                    </>
                    }

                    {data?.type === 'embedded' &&
                        <iframe style={{border: "1px solid rgba(0, 0, 0, 0.1)"}} className="w-full max-w-[800px]" height="450"
                                src={data?.url}
                                allowFullScreen></iframe>}
                </div>
            )}

        </div>

    );
}