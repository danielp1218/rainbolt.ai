interface UserIdPageProps{
    params: {
        userId: string
    }
}

const Page = ({params}: UserIdPageProps) => {
  return (
    <div>  
        Users ID: {params.userId}
    </div>
);
}

export default Page