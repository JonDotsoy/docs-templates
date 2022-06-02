import { FC } from "react"
import { GetStaticPaths, GetStaticProps } from "next"
import provider from "../../provider"
import { readFile } from "fs/promises"
import { parse } from "@textlint/markdown-to-ast"
import { MD } from "../../components/MD"
import { InspectLazy } from "../../components/InspectLazy"
import { ParsedUrlQuery } from "querystring"
import { TxtNode } from "@textlint/ast-node-types"

interface Params {
  type: string
  payload: any
}

interface URLQuery extends ParsedUrlQuery {
  slug: string[]
}


export const getStaticPaths: GetStaticPaths<URLQuery> = async () => {
  const items = await provider.listItems();

  return {
    fallback: false,
    paths: [
      ...items.map(item => ({ params: { slug: item.slug } }))
    ],
  }
}


export const getStaticProps: GetStaticProps<Params, URLQuery> = async ({ params }) => {
  const slug = params?.slug;
  if (!slug) return { notFound: true };
  const d = await provider.selectItem(slug);
  if (!d) return { notFound: true };
  return {
    props: {
      type: 'md',
      payload: parse<TxtNode>(await readFile(d.url, 'utf-8')),
    },
    notFound: false,
  }
}


const DocRenderPage: FC<Params> = ({ payload }) => {
  return <>
    <div className="bg-white shadow flex justify-center py-4">
      <div className="container grid grid-cols-5 items-center">
        <div className="col-span-1 border-r">Brand</div>
        <div className="col-span-3"></div>
        <div className="col-span-1">
          <input type="text" placeholder="Buscar" className="border p-4" />
        </div>
      </div>
    </div>
    <div className="flex justify-center">
      <div className="container grid grid-cols-5">
        <div className="col-span-1"></div>
        <div className="col-span-3">
          <MD.Factory node={payload} className="p-4"></MD.Factory>
        </div>
        <div className="col-span-1"></div>
      </div>
    </div>
    <InspectLazy src={payload} />
  </>
}

export default DocRenderPage;
