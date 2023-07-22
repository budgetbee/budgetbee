import React, { useEffect, useState } from "react";
import Layout from "../../layout/Layout";
import Api from "../../../Api/Endpoints";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function List() {
  const [parentCategories, setParentCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState();
  const [newCategory, setNewCategory] = useState(null);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  useEffect(() => {
    async function fetchParentCategories() {
      const data = await Api.getParentCategories();
      setParentCategories(data);
    }
    fetchParentCategories();
  }, []);

  useEffect(() => {
    async function fetchCategoriesByParent() {
      if (parentCategory) {
        const data = await Api.getCategoriesByParent(parentCategory.id);
        setCategories(data);
      }
    }
    fetchCategoriesByParent();
  }, [parentCategory]);

  const handleParentCategoryClick = (pCat) => {
    setParentCategory(pCat);
  };

  const handleCreateCategory = (parentCategory) => {
    setNewCategory({
      parent_category_id: parentCategory.id,
      icon: parentCategory.icon,
    });
  };

  const saveNewCategory = async () => {
    await Api.createOrUpdateCategory(newCategory);
    const data = await Api.getCategoriesByParent(parentCategory.id);
    setCategories(data);
    setNewCategory(null);
  };

  const saveEditCategory = async () => {
    const id = categoryToEdit.id;
    await Api.createOrUpdateCategory(categoryToEdit, id);
    const data = await Api.getCategoriesByParent(parentCategory.id);
    setCategories(data);
    setCategoryToEdit(null);
  };

  const handleNewCategoryName = (event) => {
    const data = { name: event.target.value };
    setNewCategory((prevData) => ({ ...prevData, ...data }));
  };

  const handleCategoryEditMode = (category) => {
    setCategoryToEdit({
      id: category.id,
      parent_category_id: category.parent_category_id,
      icon: category.icon,
    });
  };

  const handleEditCategoryName = (event) => {
    const data = { name: event.target.value };
    setCategoryToEdit((prevData) => ({ ...prevData, ...data }));
  };

  const createNewCategory = (
    <div className="pb-5">
      {!newCategory ? (
        <button
          type="button"
          onClick={() => handleCreateCategory(parentCategory)}
          className="w-11/12 block m-auto py-3 text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 focus:ring-green-800 shadow-lg shadow-green-500/50 shadow-lg shadow-green-800/80 font-medium rounded-lg text-xl text-center"
        >
          Create
        </button>
      ) : (
        <div className="flex flex-row gap-x-5 py-3 items-center text-white hover:bg-gray-400/10 transition px-10">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: parentCategory.color }}
          >
            <FontAwesomeIcon icon={parentCategory.icon} />
          </div>
          <div className="w-96">
            <input
              type="text"
              onChange={handleNewCategoryName}
              className="block w-full p-4 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="pl-5">
            <button type="button" onClick={saveNewCategory}>
              <FontAwesomeIcon icon="fa-solid fa-check" className="text-2xl text-green-400" />
            </button>
          </div>
          <div className="pl-5">
            <button type="button" onClick={() => setNewCategory(null)}>
              <FontAwesomeIcon icon="fa-solid fa-xmark" className="text-2xl text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="flex flex-row gap-x-10 bg-gray-800 top-0 left-0 w-full px-10 mt-14">
        <div className="flex flex-col divide-y divide-gray-600/50 rounded-3xl bg-gray-700 py-10 basis-6/12">
          {parentCategories.map((pCat, index) => (
            <div
              key={index}
              className="flex flex-row gap-x-5 py-3 cursor-pointer items-center text-white hover:bg-gray-400/10 transition px-10"
              onClick={() => handleParentCategoryClick(pCat)}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: pCat.color }}
              >
                <FontAwesomeIcon icon={pCat.icon} />
              </div>
              <div>{pCat.name}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-col divide-y divide-gray-600/50 rounded-3xl bg-gray-700 py-10 basis-6/12">
          {categories.length > 0 && createNewCategory}
          {categories.map((category, index) => (
            <div key={index} className="flex flex-row justify-between hover:bg-gray-400/10 transition px-10">
              <div className="flex flex-row gap-x-5 py-3 items-center text-white" index={index}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: category.color }}>
                  <FontAwesomeIcon icon={category.icon} />
                </div>
                <div>
                  {category.id !== categoryToEdit?.id ? (
                    category.name
                  ) : (
                    <input
                      type="text"
                      onChange={handleEditCategoryName}
                      defaultValue={category.name}
                      className="block w-full p-3 border border-gray-700 rounded-lg bg-gray-800 sm:text-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              </div>
              <div className="flex flex-row gap-x-10">
                {category.id === categoryToEdit?.id && (
                  <>
                    <button type="button" onClick={saveEditCategory}>
                      <FontAwesomeIcon icon="fa-solid fa-check" className="text-2xl text-green-400" />
                    </button>
                    <button type="button" onClick={() => setCategoryToEdit(null)}>
                      <FontAwesomeIcon icon="fa-solid fa-xmark" className="text-2xl text-gray-400" />
                    </button>
                  </>
                )}
                <button type="button" onClick={() => handleCategoryEditMode(category)}>
                  <FontAwesomeIcon icon="fa-solid fa-pen-to-square" className="text-2xl text-gray-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
